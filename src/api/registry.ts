/**
 * Single registry of Laravel endpoints, taken from docs/api/openapi.yaml and
 * LOVABLE_LEMONADE_API_INTEGRATION_GUIDE.md. Services must use these — no
 * endpoint strings in components. Nothing here is invented.
 */
type Id = string | number;
const v1 = "/api/v1";

export const endpoints = {
  auth: {
    login: `${v1}/auth/login`,
    logout: `${v1}/auth/logout`,
    me: `${v1}/auth/me`,
    forgotPassword: `${v1}/auth/forgot-password`,
    resetPassword: `${v1}/auth/reset-password`,
  },
  assistant: { chat: `${v1}/assistant/chat` },
  public: {
    featuredContent: "/api/public/featured-content",
    blogPosts: "/api/public/blog-posts",
    blogPost: (slug: string) => `/api/public/blog-posts/${encodeURIComponent(slug)}`,
    events: "/api/public/events",
    campaigns: "/api/public/campaigns",
    categories: "/api/public/categories",
    services: "/api/dental/services",
    doctors: "/api/dental/doctors",
    availableTimes: "/api/dental/available-times",
  },
  patients: {
    list: `${v1}/patients`,
    detail: (id: Id) => `${v1}/patients/${id}`,
    consultations: (id: Id) => `${v1}/patients/${id}/consultations`,
    vitals: (id: Id) => `${v1}/patients/${id}/vitals`,
    latestVitals: (id: Id) => `${v1}/patients/${id}/vitals/latest`,
    prescriptions: (id: Id) => `${v1}/patients/${id}/prescriptions`,
    labOrders: (id: Id) => `${v1}/patients/${id}/lab-orders`,
    radiologyOrders: (id: Id) => `${v1}/patients/${id}/radiology-orders`,
    dentalChart: (id: Id) => `${v1}/patients/${id}/dental-chart`,
    toothHistory: (id: Id, tooth: Id) => `${v1}/patients/${id}/dental-chart/teeth/${tooth}/history`,
    dentalChartBatch: (id: Id) => `${v1}/patients/${id}/dental-chart/batch`,
  },
  appointments: {
    list: `${v1}/appointments`,
    availability: `${v1}/appointments/availability/check`,
    detail: (id: Id) => `${v1}/appointments/${id}`,
    confirm: (id: Id) => `${v1}/appointments/${id}/confirm`,
    checkIn: (id: Id) => `${v1}/appointments/${id}/check-in`,
    cancel: (id: Id) => `${v1}/appointments/${id}/cancel`,
    noShow: (id: Id) => `${v1}/appointments/${id}/no-show`,
    addToQueue: (id: Id) => `${v1}/appointments/${id}/add-to-queue`,
  },
  queue: {
    list: `${v1}/queue`,
    stats: `${v1}/queue/stats`,
    callNext: `${v1}/queue/call-next`,
    detail: (id: Id) => `${v1}/queue/${id}`,
    call: (id: Id) => `${v1}/queue/${id}/call`,
    /** P0 BLOCKED — do not call from production UI until the backend workflow is fixed. */
    startUnsafe: (id: Id) => `${v1}/queue/${id}/start`,
    complete: (id: Id) => `${v1}/queue/${id}/complete`,
    skip: (id: Id) => `${v1}/queue/${id}/skip`,
    assignDentist: (id: Id) => `${v1}/queue/${id}/assign-dentist`,
  },
  consultations: {
    list: `${v1}/consultations`,
    checkEligibility: `${v1}/consultations/check-eligibility`,
    detail: (id: Id) => `${v1}/consultations/${id}`,
    complete: (id: Id) => `${v1}/consultations/${id}/complete`,
  },
  vitals: { list: `${v1}/vitals`, detail: (id: Id) => `${v1}/vitals/${id}` },
  prescriptions: {
    list: `${v1}/prescriptions`,
    detail: (id: Id) => `${v1}/prescriptions/${id}`,
    dispense: (id: Id) => `${v1}/prescriptions/${id}/dispense`,
  },
  labOrders: {
    list: `${v1}/lab-orders`,
    pending: `${v1}/lab-orders-pending`,
    detail: (id: Id) => `${v1}/lab-orders/${id}`,
    collectSample: (id: Id) => `${v1}/lab-orders/${id}/collect-sample`,
    recordResults: (id: Id) => `${v1}/lab-orders/${id}/record-results`,
    cancel: (id: Id) => `${v1}/lab-orders/${id}/cancel`,
  },
  radiologyOrders: {
    list: `${v1}/radiology-orders`,
    pending: `${v1}/radiology-orders-pending`,
    detail: (id: Id) => `${v1}/radiology-orders/${id}`,
    recordResults: (id: Id) => `${v1}/radiology-orders/${id}/record-results`,
    cancel: (id: Id) => `${v1}/radiology-orders/${id}/cancel`,
  },
  dentalChart: { list: `${v1}/dental-chart`, detail: (id: Id) => `${v1}/dental-chart/${id}` },
  invoices: { list: `${v1}/invoices`, detail: (id: Id) => `${v1}/invoices/${id}` },
  /** Append-only: no PUT/DELETE exists (405). */
  payments: { list: `${v1}/payments`, detail: (id: Id) => `${v1}/payments/${id}` },
  mpesa: { status: (checkoutRequestId: string) => `${v1}/mpesa/transactions/${encodeURIComponent(checkoutRequestId)}` },
  inventory: {
    products: `${v1}/inventory/products`,
    product: (id: Id) => `${v1}/inventory/products/${id}`,
    categories: `${v1}/inventory/categories`,
    suppliers: `${v1}/inventory/suppliers`,
  },
  reports: {
    revenue: `${v1}/reports/revenue`,
    appointments: `${v1}/reports/appointments`,
    financial: `${v1}/reports/financial`,
    inventory: `${v1}/reports/inventory`,
  },
  search: `${v1}/search`,
  notifications: { list: `${v1}/notifications`, detail: (id: Id) => `${v1}/notifications/${id}` },
  users: { list: `${v1}/users`, detail: (id: Id) => `${v1}/users/${id}` },
} as const;

/** Exact server enum for payment purpose. Never extend in the UI. */
export const PAYMENT_PURPOSES = [
  "Consultation Fee", "Dental Consultation", "Treatment", "Dental Procedure", "Prescription",
  "Medication", "Laboratory Service", "Radiology Service", "Product Purchase", "Invoice Payment",
  "Insurance Copayment", "Other",
] as const;
export const PAYMENT_METHODS = ["cash", "mpesa", "card", "bank", "insurance", "other"] as const;
