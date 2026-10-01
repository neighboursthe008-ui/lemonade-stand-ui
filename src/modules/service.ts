import { ApiError, request } from "@/api/client/http";
import { dataSourceFor, MOCK_ALLOWED } from "@/config/env";
import type { ModuleConfig, Row } from "./types";
import { resolveNames } from "./seedKit";

export interface ListParams { page: number; perPage: number; search?: string; filters?: Record<string, string>; patientId?: number }
export interface Page { items: Row[]; page: number; lastPage: number; total: number }

/** Same interface for Laravel and mock implementations — the UI never branches on source. */
export interface ResourceService {
  readonly source: "api" | "mock";
  list(p: ListParams): Promise<Page>;
  get(id: number): Promise<Row>;
  create(values: Record<string, unknown>): Promise<{ row: Row; message: string }>;
  update(id: number, values: Record<string, unknown>): Promise<{ row: Row; message: string }>;
  remove(id: number): Promise<{ message: string }>;
  action(id: number, key: string, payload: Record<string, unknown>): Promise<{ row: Row; message: string }>;
  pageAction(key: string): Promise<{ message: string }>;
}

const MOCK_NOTE = "Saved to development data only — not sent to the clinic system.";
const stores = new Map<string, Row[]>();
export function mockRows(cfg: ModuleConfig): Row[] {
  let rows = stores.get(cfg.key);
  if (!rows) { rows = Array.from({ length: cfg.seedCount }, (_, i) => ({ id: cfg.seedCount - i, ...cfg.seed(i) }) as Row); stores.set(cfg.key, rows); }
  return rows;
}
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const text = (v: unknown) => (v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)).toLowerCase();

function createMockService(cfg: ModuleConfig): ResourceService {
  const find = (id: number) => { const r = mockRows(cfg).find((x) => x.id === id); if (!r) throw new ApiError(`${cfg.singular} not found`, 404, "not_found"); return r; };
  const put = (row: Row) => stores.set(cfg.key, mockRows(cfg).map((x) => (x.id === row.id ? row : x)));
  return {
    source: "mock",
    async list({ page, perPage, search, filters, patientId }) {
      const q = search?.trim().toLowerCase();
      const rows = mockRows(cfg).filter((r) =>
        (!q || Object.values(r).some((v) => text(v).includes(q))) &&
        (!patientId || r["patient_id"] === patientId) &&
        Object.entries(filters ?? {}).every(([k, v]) => !v || String(r[k]) === v));
      return wait({ items: rows.slice((page - 1) * perPage, page * perPage), page, lastPage: Math.max(1, Math.ceil(rows.length / perPage)), total: rows.length });
    },
    get: async (id) => wait(find(id)),
    async create(values) {
      const rows = mockRows(cfg);
      const base = cfg.seed(rows.length);
      const row = { ...base, ...values, ...resolveNames(values), id: Math.max(0, ...rows.map((r) => r.id)) + 1, created_at: new Date().toISOString() } as Row;
      stores.set(cfg.key, [row, ...rows]);
      return wait({ row, message: `${cfg.singular} created. ${MOCK_NOTE}` });
    },
    async update(id, values) {
      const row = { ...find(id), ...values, ...resolveNames(values) } as Row; put(row);
      return wait({ row, message: `${cfg.singular} updated. ${MOCK_NOTE}` });
    },
    async remove(id) { find(id); stores.set(cfg.key, mockRows(cfg).filter((r) => r.id !== id)); return wait({ message: `${cfg.singular} deleted. ${MOCK_NOTE}` }); },
    async action(id, key, payload) {
      const a = cfg.actions?.find((x) => x.key === key);
      if (!a) throw new ApiError("Unknown action", 400, "unknown");
      const prev = find(id);
      const row = { ...prev, ...(a.to ? { status: a.to } : {}), ...payload, ...resolveNames(payload), ...(a.mock?.(prev, payload) ?? {}) } as Row;
      put(row);
      return wait({ row, message: `${a.label}: done. ${a.mockOnly ?? MOCK_NOTE}` });
    },
    async pageAction(key) {
      const a = cfg.pageActions?.find((x) => x.key === key);
      if (!a) throw new ApiError("Unknown action", 400, "unknown");
      const res = a.mock(mockRows(cfg)); stores.set(cfg.key, res.rows);
      return wait({ message: `${res.message} ${a.mockOnly ?? "(development data)"}` });
    },
  };
}

function createLaravelService(cfg: ModuleConfig): ResourceService {
  const b = cfg.laravel!;
  const missing = (what: string) => new ApiError(`${what} is not available in the clinic system's API yet.`, 501, "unknown");
  const detail = (id: number) => { if (!b.detail) throw missing(`${cfg.singular} details`); return b.detail(id); };
  const asArr = (d: unknown) => (Array.isArray(d) ? (d as Row[]) : []);
  return {
    source: "api",
    async list({ page, perPage, search, filters, patientId }) {
      const r = await request<unknown>(b.list, { query: { page, per_page: perPage, search, patient_id: patientId, ...filters } });
      const items = asArr(r.data);
      return { items, page: r.meta?.current_page ?? page, lastPage: r.meta?.last_page ?? 1, total: r.meta?.total ?? items.length };
    },
    get: async (id) => (await request<Row>(detail(id))).data,
    async create(values) { if (!b.create) throw missing(`Creating ${cfg.title.toLowerCase()}`); const r = await request<Row>(b.list, { method: "POST", body: values }); return { row: r.data, message: r.message ?? `${cfg.singular} created` }; },
    async update(id, values) { if (!b.update) throw missing(`Editing ${cfg.title.toLowerCase()}`); const r = await request<Row>(detail(id), { method: "PUT", body: values }); return { row: r.data, message: r.message ?? `${cfg.singular} updated` }; },
    async remove(id) { if (!b.remove) throw missing(`Deleting ${cfg.title.toLowerCase()}`); const r = await request<unknown>(detail(id), { method: "DELETE" }); return { message: r.message ?? `${cfg.singular} deleted` }; },
    async action(id, key, payload) {
      const a = cfg.actions?.find((x) => x.key === key);
      if (a?.mockOnly) throw new ApiError(a.mockOnly, 501, "unknown");
      const ep = b.actions?.[key];
      if (!ep) throw missing(a?.label ?? key);
      const r = await request<Row>(ep(id), { method: "POST", body: payload });
      return { row: r.data, message: r.message ?? `${a?.label ?? key}: done` };
    },
    async pageAction(key) {
      const a = cfg.pageActions?.find((x) => x.key === key);
      if (a?.mockOnly) throw new ApiError(a.mockOnly, 501, "unknown");
      const ep = b.pageActions?.[key];
      if (!ep) throw missing(a?.label ?? key);
      const r = await request<unknown>(ep, { method: "POST" });
      return { message: r.message ?? `${a?.label}: done` };
    },
  };
}

/** Production runtime with a real session never serves mock fixtures: modules without Laravel APIs report NOT_IMPLEMENTED. */
function createNotImplementedService(cfg: ModuleConfig): ResourceService {
  const fail = () => Promise.reject(new ApiError(`${cfg.title}: the hospital server does not provide this feature yet (NOT_IMPLEMENTED).`, 501, "unknown"));
  return { source: "api", list: fail, get: fail, create: fail, update: fail, remove: fail, action: fail, pageAction: fail };
}

const cache = new Map<string, ResourceService>();
/** Dev profiles have no Laravel token → mock. Otherwise Laravel when a documented binding exists and the module isn't forced to mock. */
export function getService(cfg: ModuleConfig, isDevSession: boolean): ResourceService {
  const live = !isDevSession && !!cfg.laravel && dataSourceFor(cfg.key.replace(/-/g, "_"), "api") === "api";
  const blockedMock = !live && !isDevSession && !MOCK_ALLOWED;
  const k = `${cfg.key}:${live}:${blockedMock}`;
  if (!cache.has(k)) cache.set(k, live ? createLaravelService(cfg) : blockedMock ? createNotImplementedService(cfg) : createMockService(cfg));
  return cache.get(k)!;
}
