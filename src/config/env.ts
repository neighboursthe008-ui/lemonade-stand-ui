/** Public, non-secret runtime configuration. Never put secrets behind VITE_. */
export type DataSource = "api" | "mock";

const env = import.meta.env as Record<string, string | undefined>;

export const API_BASE_URL = (env["VITE_API_BASE_URL"] ?? "http://127.0.0.1:8001").replace(/\/$/, "");

const globalMode: DataSource = env["VITE_DATA_MODE"] === "api" ? "api" : "mock";

/** Per-module override, e.g. VITE_PATIENTS_DATA_SOURCE=api */
export function dataSourceFor(module: string, fallback: DataSource = globalMode): DataSource {
  const v = env[`VITE_${module.toUpperCase()}_DATA_SOURCE`];
  return v === "api" || v === "mock" ? v : fallback;
}

/** Mock fixtures are allowed in development/test only (or an explicit QA build). Never in the production runtime. */
export const MOCK_ALLOWED = import.meta.env.DEV || env["VITE_ALLOW_MOCK_FIXTURES"] === "true";

/** Mock indicators are visible in dev, or in production only when explicitly enabled. */
export const SHOW_MOCK_INDICATORS = import.meta.env.DEV || env["VITE_SHOW_MOCK_INDICATORS"] === "true";

/** Development profiles let QA explore staff screens without the Laravel server. Disabled in prod unless opted in. */
export const DEV_PROFILES_ENABLED = import.meta.env.DEV || env["VITE_ENABLE_DEV_PROFILES"] === "true";
