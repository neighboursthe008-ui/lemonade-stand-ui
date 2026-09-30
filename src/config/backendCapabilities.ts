import { dataSourceFor } from "./env";

export type IntegrationStatus = "LIVE_API" | "PARTIAL_API" | "MOCK" | "BLOCKED";

export const backendCapabilities = {
  auth: "api",
  publicSite: "api",
  dashboard: "mock",
  patients: "api",
  appointments: "api",
  queue: "partial",
  clinical: "api",
  billing: "partial",
  inventory: "partial",
  reports: "api",
  notifications: "partial",
  search: "api",
  users: "api",
  shop: "mock",
  patientPortal: "mock",
  marketing: "mock",
  administration: "mock",
  payroll: "blocked",
} as const;

export interface ScreenStatus {
  screen: string; route: string; endpoint: string; status: IntegrationStatus; source: string; limitation?: string;
}

/** Screen-level registry shown at /dev/integration-status. Grows with each phase. */
export const screenStatuses: ScreenStatus[] = [
  { screen: "Home", route: "/", endpoint: "GET /api/public/featured-content, /api/dental/services, /api/dental/doctors", status: "LIVE_API", source: "api" },
  { screen: "Services / detail", route: "/services, /services/:id", endpoint: "GET /api/dental/services", status: "LIVE_API", source: "api", limitation: "Backend returns a fixed list (id, name); no detail endpoint" },
  { screen: "Dentists / detail", route: "/doctors, /doctors/:id", endpoint: "GET /api/dental/doctors", status: "LIVE_API", source: "api", limitation: "Backend returns placeholder names from controller" },
  { screen: "Booking", route: "/appointments", endpoint: "GET /api/dental/available-times?doctor&date", status: "PARTIAL_API", source: "api", limitation: "Submission is Blade-only (POST /dental/appointments); POST /api/v1/appointments needs staff token. Times are fixed server-side." },
  { screen: "Blog / article", route: "/blog, /blog/:slug", endpoint: "GET /api/public/blog-posts(/{slug})", status: "LIVE_API", source: "api" },
  { screen: "News / gallery / testimonials", route: "/news, /gallery, /testimonials", endpoint: "GET /api/public/featured-content", status: "LIVE_API", source: "api" },
  { screen: "Events", route: "/events", endpoint: "GET /api/public/events", status: "LIVE_API", source: "api" },
  { screen: "Contact form", route: "/contact", endpoint: "— (Blade POST /contact)", status: "BLOCKED", source: "—", limitation: "No JSON contact endpoint" },
  { screen: "Clinic assistant", route: "all public pages", endpoint: "POST /api/v1/assistant/chat", status: "LIVE_API", source: "api" },
  { screen: "Staff login", route: "/auth/login", endpoint: "POST /api/v1/auth/login → GET /api/v1/auth/me", status: "LIVE_API", source: "api", limitation: "Dev profiles available in development only" },
  { screen: "Forgot password", route: "/auth/forgot-password", endpoint: "POST /api/v1/auth/forgot-password", status: "LIVE_API", source: "api", limitation: "UI hides account-existence (backend enumerates)" },
  { screen: "Dashboard", route: "/app/dashboard", endpoint: "— (no KPI contract)", status: "MOCK", source: dataSourceFor("dashboard", "mock"), limitation: "Laravel dashboard KPI API missing" },
  { screen: "Queue → Start consultation", route: "/app/queue", endpoint: "POST /api/v1/queue/{id}/start", status: "BLOCKED", source: "—", limitation: "P0: API start diverges from Blade transaction" },
  { screen: "Payroll", route: "—", endpoint: "—", status: "BLOCKED", source: "—", limitation: "Payroll backend not yet implemented" },
  { screen: "Super Admin PIN", route: "/admin/*", endpoint: "— (Blade only)", status: "BLOCKED", source: "—", limitation: "No PIN API; not verified client-side" },
];
