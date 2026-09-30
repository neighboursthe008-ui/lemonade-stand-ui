import { API_BASE_URL } from "@/config/env";

export type ApiErrorKind =
  | "unauthenticated" | "forbidden" | "not_found" | "method_not_allowed" | "conflict"
  | "csrf" | "validation" | "rate_limited" | "server" | "network" | "timeout" | "unknown";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public kind: ApiErrorKind,
    public code?: string,
    public errors?: Record<string, string[]>,
    public details?: unknown,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface Envelope<T> {
  data: T;
  meta?: PaginationMeta;
  links?: Record<string, string | null>;
  message?: string;
}
export interface PaginationMeta {
  current_page: number; from: number | null; last_page: number; per_page: number; to: number | null; total: number;
}

const kindFor = (s: number): ApiErrorKind =>
  s === 401 ? "unauthenticated" : s === 403 ? "forbidden" : s === 404 ? "not_found" : s === 405 ? "method_not_allowed"
  : s === 409 ? "conflict" : s === 419 ? "csrf" : s === 422 ? "validation" : s === 429 ? "rate_limited"
  : s >= 500 ? "server" : "unknown";

let tokenProvider: () => string | null = () => null;
let onUnauthenticated: () => void = () => {};
export function configureHttp(opts: { getToken: () => string | null; onUnauthenticated: () => void }) {
  tokenProvider = opts.getToken;
  onUnauthenticated = opts.onUnauthenticated;
}

type Query = Record<string, string | number | boolean | undefined | null>;
interface RequestOpts { method?: string; body?: unknown; query?: Query; signal?: AbortSignal; timeoutMs?: number; auth?: boolean }

async function raw(path: string, { method = "GET", body, query, signal, timeoutMs = 20000, auth = true }: RequestOpts = {}) {
  const url = new URL(API_BASE_URL + path);
  Object.entries(query ?? {}).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && url.searchParams.set(k, String(v)));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort("timeout"), timeoutMs);
  signal?.addEventListener("abort", () => ctrl.abort(signal.reason));
  const token = auth ? tokenProvider() : null;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (ctrl.signal.aborted && ctrl.signal.reason === "timeout") throw new ApiError("The server took too long to respond.", 0, "timeout");
    if (signal?.aborted) throw e;
    throw new ApiError("Cannot reach the clinic server. Check your connection.", 0, "network");
  } finally {
    clearTimeout(timer);
  }
  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const kind = kindFor(res.status);
    if (kind === "unauthenticated" && token) onUnauthenticated();
    throw new ApiError(
      payload?.message ?? `Request failed (${res.status})`, res.status, kind, payload?.code, payload?.errors,
      payload?.details, Number(res.headers.get("Retry-After")) || undefined,
    );
  }
  return payload;
}

/** Standard `{ success, data, meta?, links? }` envelope. */
export async function request<T>(path: string, opts?: RequestOpts): Promise<Envelope<T>> {
  const p = await raw(path, opts);
  if (p && typeof p === "object" && "data" in p) return { data: p.data as T, meta: p.meta, links: p.links, message: p.message };
  return { data: p as T, message: p?.message };
}

/** For bare payloads such as GET /api/v1/search → { results }. */
export const requestRaw = <T>(path: string, opts?: RequestOpts) => raw(path, opts) as Promise<T>;

/** Read retry policy: retry once on 5xx/network only; never on 4xx. */
export function shouldRetryRead(count: number, err: unknown) {
  return count < 1 && err instanceof ApiError && (err.kind === "server" || err.kind === "network");
}
