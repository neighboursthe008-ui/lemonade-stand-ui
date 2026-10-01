/**
 * FRONTEND INTEGRATION REGISTRY — the single source of truth for "which frontend feature
 * uses which API, and is it actually working?". The API *path* registry is src/api/registry.ts.
 *
 * Rule: entries may NOT declare LIVE_API. LIVE_API is derived only from a passing record in
 * verification-results.json, which is written by scripts/verify-integrations.ts against a real
 * Laravel server. A failing verification turns the entry BLOCKED automatically.
 */
import verification from "./verification-results.json";

export type IntegrationStatus = "NOT_CONNECTED" | "MOCK" | "API_DEFINED" | "API_CONNECTED" | "LIVE_API" | "PARTIAL_API" | "BLOCKED" | "NOT_IMPLEMENTED" | "DEPRECATED";
export type DeclaredStatus = Exclude<IntegrationStatus, "LIVE_API">;
export type Origin = "existing" | "proposed" | "none";

export interface IntegrationEntry {
  id: string; module: string; screen: string; route: string; feature: string;
  method: string; endpoint: string; origin: Origin;
  auth: "public" | "bearer"; permission: string; branchScope: boolean; orgScope: boolean;
  declared: DeclaredStatus; source: "api" | "mock" | "none"; notes: string;
}
export interface ResolvedEntry extends IntegrationEntry { status: IntegrationStatus; lastVerified: string | null }

interface VerificationRecord { ok: boolean; at: string; checks: Record<string, boolean>; error?: string }
const results = (verification as { results: Record<string, VerificationRecord> }).results;

type Row = [feature: string, route: string, method: string, endpoint: string, declared: DeclaredStatus, permission?: string, notes?: string];

const origin = (s: DeclaredStatus, ep: string): Origin => (ep === "—" ? "none" : s === "API_DEFINED" || s === "NOT_IMPLEMENTED" ? "proposed" : "existing");
const sourceOf = (s: DeclaredStatus): IntegrationEntry["source"] => (s === "API_CONNECTED" || s === "PARTIAL_API" ? "api" : s === "MOCK" || s === "NOT_IMPLEMENTED" || s === "API_DEFINED" ? "mock" : "none");

function group(prefix: string, module: string, screen: string, rows: Row[], opts: { auth?: "public" | "bearer"; branch?: boolean } = {}): IntegrationEntry[] {
  return rows.map(([feature, route, method, endpoint, declared, permission = "authenticated", notes = ""], i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, "0")}`, module, screen, route, feature, method, endpoint,
    origin: origin(declared, endpoint), auth: opts.auth ?? "bearer", permission: opts.auth === "public" ? "—" : permission,
    branchScope: opts.branch ?? opts.auth !== "public", orgScope: opts.auth !== "public", declared, source: sourceOf(declared), notes,
  }));
}

const NI = "NOT_IMPLEMENTED" as const, AC = "API_CONNECTED" as const, PA = "PARTIAL_API" as const, BL = "BLOCKED" as const, AD = "API_DEFINED" as const, MO = "MOCK" as const;
const H = "/api/v1/hospital";

export const integrations: IntegrationEntry[] = [
  ...group("AUTH", "Authentication", "Staff sign-in", [
    ["Login", "/auth/login", "POST", "/api/v1/auth/login", AC, "—", "Returns bearer token"],
    ["Logout", "(staff menu)", "POST", "/api/v1/auth/logout", AC],
    ["Me / capabilities", "(all staff routes)", "GET", "/api/v1/auth/me", AC, "authenticated", "Roles, permissions, organisation, branch"],
    ["Forgot password", "/auth/forgot-password", "POST", "/api/v1/auth/forgot-password", AC, "—", "UI hides account existence"],
    ["Reset password", "/auth/reset-password", "POST", "/api/v1/auth/reset-password", AD, "—", "Endpoint documented; reset screen not built"],
    ["Change password", "(profile)", "POST", "/api/v1/auth/change-password", NI],
    ["Sessions", "(profile)", "GET", "/api/v1/auth/sessions", NI],
    ["Super admin PIN", "/admin/*", "POST", "/api/v1/auth/pin/verify", BL, "super_admin", "Blade-only today; no JSON API"],
    ["MFA", "—", "POST", "/api/v1/auth/mfa/verify", NI],
  ]),
  ...group("DASH", "Dashboards", "Role dashboards", [
    "Super Admin", "Hospital Admin", "Doctor", "Dentist", "Nurse", "Receptionist", "Cashier", "Accountant", "Inventory", "Pharmacist", "Laboratory", "Radiology", "HR",
  ].map((r): Row => [`${r} dashboard`, "/app/dashboard", "GET", "/api/v1/dashboard?role=", MO, "authenticated", "No KPI contract in Laravel; development data"])
    .concat([["Patient portal dashboard", "/portal", "GET", "/api/v1/portal/dashboard", NI], ["Department dashboards", "/app/dashboard", "GET", `${H}/departments/{id}/dashboard`, NI]])),
  ...group("PAT", "Patients", "Patients", [
    ["List", "/app/patients", "GET", "/api/v1/patients", AC, "view_patients"],
    ["Search", "/app/patients", "GET", "/api/v1/patients?search=", AC, "view_patients"],
    ["Registration", "/app/patients/new", "POST", "/api/v1/patients", AC, "create_patients", "422 mapped per field"],
    ["Profile", "/app/patients/$id", "GET", "/api/v1/patients/{id}", AC, "view_patients"],
    ["Edit", "/app/patients/$id/edit", "PUT", "/api/v1/patients/{id}", AC, "edit_patients"],
    ["Vitals", "/app/patients/$id", "GET", "/api/v1/patients/{id}/vitals", AC, "view_vitals"],
    ["Latest vitals", "/app/patients/$id", "GET", "/api/v1/patients/{id}/vitals/latest", AC, "view_vitals"],
    ["Visits / encounters", "/app/patients/$id", "GET", `${H}/patients/{id}/encounters`, NI],
    ["Consultations", "/app/patients/$id", "GET", "/api/v1/patients/{id}/consultations", AC, "view_consultations"],
    ["Prescriptions", "/app/patients/$id", "GET", "/api/v1/patients/{id}/prescriptions", AC, "view_prescriptions"],
    ["Lab orders", "/app/patients/$id", "GET", "/api/v1/patients/{id}/lab-orders", AC, "view_lab_orders"],
    ["Radiology orders", "/app/patients/$id", "GET", "/api/v1/patients/{id}/radiology-orders", AC, "view_radiology_orders"],
    ["Treatments / procedures", "/app/patients/$id", "GET", `${H}/patients/{id}/procedures`, NI],
    ["Documents", "/app/patients/$id", "GET", "/api/v1/patients/{id}/documents", NI],
    ["Images", "/app/patients/$id", "GET", "/api/v1/patients/{id}/images", NI],
    ["Insurance", "/app/patients/$id", "GET", "/api/v1/patients/{id}/insurance", NI],
    ["Payments", "/app/patients/$id", "GET", "/api/v1/payments?patient_id=", AC, "view_payments"],
    ["Dental chart (tab)", "/app/patients/$id", "GET", "/api/v1/patients/{id}/dental-chart", AC, "view_dental_chart"],
  ]),
  ...group("APT", "Appointments", "Appointments", [
    ["List", "/app/appointments", "GET", "/api/v1/appointments", AC, "view_appointments"],
    ["Calendar", "/app/appointments", "GET", "/api/v1/appointments?from=&to=", PA, "view_appointments", "Client-side calendar over list"],
    ["Create", "/app/appointments", "POST", "/api/v1/appointments", AC, "create_appointments"],
    ["Edit / reschedule", "/app/appointments", "PUT", "/api/v1/appointments/{id}", AC, "edit_appointments"],
    ["Confirm", "/app/appointments", "POST", "/api/v1/appointments/{id}/confirm", AC, "edit_appointments"],
    ["Cancel", "/app/appointments", "POST", "/api/v1/appointments/{id}/cancel", AC, "edit_appointments"],
    ["Check-in", "/app/appointments", "POST", "/api/v1/appointments/{id}/check-in", AC, "edit_appointments"],
    ["No-show", "/app/appointments", "POST", "/api/v1/appointments/{id}/no-show", AC, "edit_appointments"],
    ["Add to queue", "/app/appointments", "POST", "/api/v1/appointments/{id}/add-to-queue", AC, "manage_queue"],
    ["Availability check", "/app/appointments", "POST", "/api/v1/appointments/availability/check", AC, "create_appointments"],
    ["Department / specialty on appointment", "/app/appointments", "POST", "/api/v1/appointments (department_id, specialty_id)", AD, "create_appointments", "Fields proposed"],
    ["Clinician schedules", "—", "GET", `${H}/clinicians/{id}/schedule`, NI],
    ["Department schedules", "—", "GET", `${H}/departments/{id}/schedule`, NI],
    ["Public booking", "/appointments", "POST", "/api/public/appointments", NI, "—", "Blade-only today; UI uses development booking service"],
  ]),
  ...group("Q", "Queue", "Queue / waiting list", [
    ["Waiting list", "/app/queue", "GET", "/api/v1/queue", AC, "view_queue"],
    ["Stats", "/app/dashboard", "GET", "/api/v1/queue/stats", AC, "view_queue"],
    ["Call next", "/app/queue", "POST", "/api/v1/queue/call-next", AC, "manage_queue"],
    ["Call patient", "/app/queue", "POST", "/api/v1/queue/{id}/call", AC, "manage_queue"],
    ["Start consultation", "/app/queue", "POST", "/api/v1/queue/{id}/start", BL, "manage_queue", "P0: unsafe transaction — never called"],
    ["Complete", "/app/queue", "POST", "/api/v1/queue/{id}/complete", AC, "manage_queue"],
    ["Skip", "/app/queue", "POST", "/api/v1/queue/{id}/skip", AC, "manage_queue"],
    ["Assign clinician", "/app/queue", "POST", "/api/v1/queue/{id}/assign-dentist", PA, "manage_queue", "Laravel path is dentist-only; hospital-wide assign-clinician proposed"],
    ["Emergency priority", "/app/queue", "PUT", "/api/v1/queue/{id}", PA, "manage_queue"],
  ]),
  ...group("CLN", "Clinical", "Clinical workspace", [
    ["Consultations list", "/app/consultations", "GET", "/api/v1/consultations", AC, "view_consultations"],
    ["Consultation create (SOAP)", "/app/consultations", "POST", "/api/v1/consultations", AC, "create_consultations"],
    ["Consultation complete", "/app/consultations", "POST", "/api/v1/consultations/{id}/complete", AC, "create_consultations"],
    ["Fee eligibility", "/app/consultations", "POST", "/api/v1/consultations/check-eligibility", AC, "create_consultations"],
    ["Department-aware encounter", "/app/consultations", "POST", `${H}/encounters`, AD, "create_consultations"],
    ["Diagnoses (ICD)", "/app/consultations", "GET", `${H}/diagnoses`, NI],
    ["Procedures", "/app/consultations", "GET", `${H}/procedures`, NI],
    ["Treatment plans", "/app/consultations", "GET", `${H}/treatment-plans`, NI],
    ["Vitals", "/app/vitals", "GET", "/api/v1/vitals", AC, "view_vitals"],
    ["Prescriptions", "/app/prescriptions", "GET", "/api/v1/prescriptions", AC, "view_prescriptions"],
    ["Clinical notes", "/app/consultations", "GET", `${H}/clinical-notes`, NI],
    ["Follow-up", "/app/consultations", "POST", `${H}/follow-ups`, NI],
  ]),
  ...hospital("ER", "Emergency", "/app/emergency", ["Triage", "Emergency registration", "Emergency queue", "Priority", "Emergency encounter", "Discharge / transfer"], "emergency"),
  ...hospital("IPD", "Inpatient", "/app/admissions", ["Admissions", "Beds", "Wards", "Transfers", "Discharge", "Bed occupancy", "Inpatient encounters"], "admissions"),
  ...hospital("NUR", "Nursing", "/app/nursing-notes", ["Nursing dashboard", "Vitals rounds", "Nursing notes", "Care plans", "Medication administration (MAR)", "Observations", "Shift handover"], "nursing"),
  ...hospital("MAT", "Maternity", "/app/maternity", ["Antenatal", "Admission", "Labour", "Delivery", "Postnatal", "Mother/newborn link"], "maternity"),
  ...hospital("PAED", "Paediatrics", "/app/paediatric-growth", ["Paediatric registration", "Growth", "Vitals", "Consultations", "Immunisation"], "paediatrics"),
  ...group("DEN", "Dental", "Dental department", [
    ["Dental chart", "/app/patients/$id", "GET", "/api/v1/patients/{id}/dental-chart", AC, "view_dental_chart"],
    ["Dental chart batch save", "/app/patients/$id", "POST", "/api/v1/patients/{id}/dental-chart/batch", AC, "edit_dental_chart"],
    ["Tooth history", "/app/patients/$id", "GET", "/api/v1/patients/{id}/dental-chart/teeth/{tooth}/history", AC, "view_dental_chart"],
    ["Dental chart list", "/app/dental-chart", "GET", "/api/v1/dental-chart", AC, "view_dental_chart"],
    ["Dental treatment plans", "/app/dental-chart", "GET", `${H}/treatment-plans?specialty=dental`, NI],
    ["Dental procedures", "/app/dental-chart", "GET", `${H}/procedures?specialty=dental`, NI],
    ["Dental consultations", "/app/consultations", "GET", "/api/v1/consultations", AC, "view_consultations", "Existing consultations are dental by origin"],
    ["Dental imaging", "/app/radiology-orders", "GET", "/api/v1/radiology-orders", AC, "view_radiology_orders"],
  ]),
  ...group("LAB", "Laboratory", "Laboratory", [
    ["Orders", "/app/lab-orders", "GET", "/api/v1/lab-orders", AC, "view_lab_orders"],
    ["Pending", "/app/lab-orders", "GET", "/api/v1/lab-orders-pending", AC, "view_lab_orders"],
    ["Collect sample", "/app/lab-orders", "POST", "/api/v1/lab-orders/{id}/collect-sample", AC, "manage_lab_orders"],
    ["Record results", "/app/lab-orders", "POST", "/api/v1/lab-orders/{id}/record-results", AC, "manage_lab_orders"],
    ["Cancel", "/app/lab-orders", "POST", "/api/v1/lab-orders/{id}/cancel", AC, "manage_lab_orders"],
    ["Result verification", "/app/lab-orders", "POST", "/api/v1/lab-orders/{id}/verify", NI],
    ["Test catalogue", "/app/lab-tests", "GET", `${H}/lab-tests`, NI],
  ]),
  ...group("RAD", "Radiology", "Radiology", [
    ["Orders", "/app/radiology-orders", "GET", "/api/v1/radiology-orders", AC, "view_radiology_orders"],
    ["Pending", "/app/radiology-orders", "GET", "/api/v1/radiology-orders-pending", AC, "view_radiology_orders"],
    ["Record results", "/app/radiology-orders", "POST", "/api/v1/radiology-orders/{id}/record-results", AC, "manage_radiology_orders"],
    ["Cancel", "/app/radiology-orders", "POST", "/api/v1/radiology-orders/{id}/cancel", AC, "manage_radiology_orders"],
    ["Scheduling", "/app/radiology-orders", "POST", "/api/v1/radiology-orders/{id}/schedule", NI],
    ["Studies / images", "/app/radiology-orders", "GET", "/api/v1/radiology-orders/{id}/studies", NI],
  ]),
  ...group("PHA", "Pharmacy", "Pharmacy", [
    ["Medicines (products)", "/app/inventory", "GET", "/api/v1/inventory/products", AC, "view_inventory"],
    ["Prescriptions queue", "/app/prescriptions", "GET", "/api/v1/prescriptions", AC, "view_prescriptions"],
    ["Dispense", "/app/prescriptions", "POST", "/api/v1/prescriptions/{id}/dispense", AC, "dispense_prescriptions", "Stock deduction is server-side"],
    ["Dispensing log", "/app/dispensing", "GET", `${H}/pharmacy/dispensings`, NI],
    ["Pharmacy orders", "/app/orders", "GET", `${H}/pharmacy/orders`, NI, "view_inventory", "Replaces former shop orders"],
    ["Pharmacy health products (public)", "/shop", "GET", "/api/public/pharmacy/products", NI, "—"],
  ]),
  ...hospital("THR", "Theatre", "/app/theatre", ["Bookings", "Procedures", "Theatre schedule", "Surgical team", "Pre-op checklist", "Post-op notes"], "theatre"),
  ...group("BIL", "Billing", "Billing", [
    ["Invoices", "/app/invoices", "GET", "/api/v1/invoices", AC, "view_invoices"],
    ["Invoice detail", "/app/invoices", "GET", "/api/v1/invoices/{id}", AC, "view_invoices"],
    ["Create invoice", "/app/invoices", "POST", "/api/v1/invoices", AC, "create_invoices"],
    ["Payments (append-only)", "/app/payments", "GET", "/api/v1/payments", AC, "view_payments"],
    ["Record payment", "/app/payments", "POST", "/api/v1/payments", AC, "create_payments", "Exact server enum purposes"],
    ["M-Pesa status", "/app/payments", "GET", "/api/v1/mpesa/transactions/{checkoutRequestId}", PA, "create_payments", "STK initiate path not documented"],
    ["Receipts", "/app/receipts", "GET", "/api/v1/payments/{id}/receipt", NI],
    ["Refunds", "/app/refunds", "POST", "/api/v1/payments/{id}/refunds", NI],
    ["Credit notes", "/app/credit-notes", "GET", "/api/v1/credit-notes", NI],
    ["Balances", "/app/invoices", "GET", "/api/v1/invoices?status=unpaid", AC, "view_invoices"],
    ["Insurance billing", "/app/claims", "GET", `${H}/insurance/claims`, NI],
  ]),
  ...noApi("ACC", "Accounting", "/app/accounts", ["Chart of accounts", "Journal entries", "Ledger", "Trial balance", "Revenue", "Expenses", "Accounts receivable", "Accounts payable", "Periods", "Bank reconciliation", "Statements"], "/api/v1/accounting"),
  ...group("INV", "Inventory", "Inventory", [
    ["Products", "/app/inventory", "GET", "/api/v1/inventory/products", AC, "view_inventory"],
    ["Product CRUD", "/app/inventory", "POST", "/api/v1/inventory/products", AC, "manage_inventory"],
    ["Categories", "/app/categories", "GET", "/api/v1/inventory/categories", AC, "view_inventory"],
    ["Suppliers", "/app/suppliers", "GET", "/api/v1/inventory/suppliers", AC, "view_inventory"],
    ["Stock movements", "/app/stock-movements", "GET", "/api/v1/inventory/movements", NI],
    ["Transfers", "/app/stock-transfers", "POST", "/api/v1/inventory/transfers", NI],
    ["Purchase orders", "/app/purchase-orders", "GET", "/api/v1/inventory/purchase-orders", NI],
    ["Receiving (GRN)", "/app/goods-received", "POST", "/api/v1/inventory/goods-received", NI],
    ["Batches & expiry", "/app/inventory", "GET", "/api/v1/inventory/batches", NI],
    ["Stock adjustments", "/app/inventory", "POST", "/api/v1/inventory/products/{id}/adjust", NI],
  ]),
  ...noApi("HR", "HR", "/app/employees", ["Employees", "Departments", "Roles", "Attendance", "Leave", "Contracts", "Documents", "Performance"], `${H}/hr`),
  ...group("PAY", "Payroll", "Payroll", [["Payroll runs", "/app/payroll", "GET", `${H}/hr/payroll-runs`, NI, "view_hr", "Backend not implemented; never computed client-side"]]),
  ...noApi("PRC", "Procurement", "/app/purchase-requests", ["Suppliers", "Requisitions", "Purchase orders", "Approvals", "Receiving", "Supplier invoices"], `${H}/procurement`),
  ...group("TND", "Public Tenders", "Tenders", [
    ["Tender list", "/tenders", "GET", "/api/public/tenders", NI, "—"], ["Tender detail", "/tenders", "GET", "/api/public/tenders/{id}", NI, "—"],
    ["Applications", "/tenders", "POST", "/api/public/tenders/{id}/applications", NI, "—"], ["Documents", "/tenders", "GET", "/api/public/tenders/{id}/documents", NI, "—"],
    ["Status (staff)", "/app/tenders", "PUT", `${H}/procurement/tenders/{id}`, NI],
  ], { auth: "public" }),
  ...noApi("PRT", "Patient Portal", "/portal", ["Profile", "Appointments", "Invoices", "Payments", "Prescriptions", "Lab results", "Radiology results", "Orders", "Notifications", "Documents"], "/api/v1/portal"),
  ...group("CMS", "CMS", "Public content", [
    ["Featured content (home, news, gallery, testimonials)", "/", "GET", "/api/public/featured-content", AC],
    ["Blog list", "/blog", "GET", "/api/public/blog-posts", AC], ["Blog article", "/blog/$slug", "GET", "/api/public/blog-posts/{slug}", AC],
    ["Events", "/events", "GET", "/api/public/events", AC], ["Categories", "/blog", "GET", "/api/public/categories", AC],
    ["Pages (staff CMS)", "/app/pages", "GET", "/api/v1/cms/pages", NI], ["Media library", "/app/media", "POST", "/api/v1/cms/media", NI],
    ["Contact form", "/contact", "POST", "/api/public/contact", NI, "—", "Blade POST /contact only"],
  ], { auth: "public" }),
  ...group("PUB", "Public Hospital Services", "Public website", [
    ["Services (legacy dental)", "/services", "GET", "/api/dental/services", AC, "—", "Kept for compatibility; fixed list"],
    ["Doctors (legacy dental)", "/doctors", "GET", "/api/dental/doctors", AC, "—", "Placeholder names"],
    ["Available times (legacy dental)", "/appointments", "GET", "/api/dental/available-times", PA, "—", "Fixed server times"],
    ["Hospital services", "/services", "GET", "/api/hospital/services", AD, "—", "Proposed replacement"],
    ["Departments", "/departments", "GET", "/api/hospital/departments", AD, "—"],
    ["Specialties", "/specialties", "GET", "/api/hospital/specialties", AD, "—", "UI uses fallback catalogue"],
    ["Doctors & specialists", "/doctors", "GET", "/api/hospital/doctors", AD, "—"],
    ["Available times", "/appointments", "GET", "/api/hospital/available-times", AD, "—"],
    ["Public assistant", "(all public pages)", "POST", "/api/v1/assistant/chat", AC, "—"],
  ], { auth: "public" }),
  ...group("MKT", "Marketing", "Marketing", [
    ["Campaigns (public)", "/", "GET", "/api/public/campaigns", AC, "—"],
    ["Campaign management", "/app/campaigns", "GET", "/api/v1/marketing/campaigns", NI], ["UTM / attribution", "/app/campaigns", "GET", "/api/v1/marketing/attribution", NI],
    ["Analytics", "/app/campaigns", "GET", "/api/v1/marketing/analytics", NI], ["Social settings", "/app/settings", "GET", "/api/v1/marketing/social", NI],
    ["SMS templates", "/app/sms-templates", "GET", `${H}/sms/templates`, NI], ["Bulk SMS", "/app/bulk-sms", "POST", `${H}/sms/campaigns`, NI],
  ]),
  ...group("NTF", "Notifications", "Notifications", [
    ["List", "/app/notifications", "GET", "/api/v1/notifications", AC], ["Detail", "/app/notifications", "GET", "/api/v1/notifications/{id}", AC],
    ["Mark read", "/app/notifications", "POST", "/api/v1/notifications/{id}/read", NI], ["Mark all read", "/app/notifications", "POST", "/api/v1/notifications/read-all", NI],
    ["Role / event notifications", "—", "GET", "/api/v1/notifications?type=", PA],
  ]),
  ...group("SRC", "Search", "Global search", ["Global", "Patients", "Appointments", "Clinical", "Billing", "Inventory", "Staff"].map((s): Row => [`${s} search`, "/app/search", "GET", `/api/v1/search?q=${s === "Global" ? "" : `&type=${s.toLowerCase()}`}`, s === "Global" ? AC : PA])),
  ...group("RPT", "Reports", "Reports", [
    ["Revenue", "/app/reports", "GET", "/api/v1/reports/revenue", AC, "view_reports"], ["Appointments", "/app/reports", "GET", "/api/v1/reports/appointments", AC, "view_reports"],
    ["Financial", "/app/reports", "GET", "/api/v1/reports/financial", AC, "view_reports"], ["Inventory", "/app/reports", "GET", "/api/v1/reports/inventory", AC, "view_reports"],
    ["Clinical", "/app/reports", "GET", "/api/v1/reports/clinical", NI], ["Operational", "/app/reports", "GET", "/api/v1/reports/operational", NI],
    ["Department", "/app/reports", "GET", "/api/v1/reports/departments/{id}", NI], ["Hospital summary", "/app/reports", "GET", "/api/v1/reports/hospital", NI],
  ]),
  ...group("ADM", "Administration", "Administration", [
    ["Users", "/app/users", "GET", "/api/v1/users", AC, "manage_users"], ["User CRUD", "/app/users", "POST", "/api/v1/users", AC, "manage_users"],
    ["Roles", "/app/roles", "GET", "/api/v1/roles", NI], ["Permissions", "/app/roles", "GET", "/api/v1/permissions", NI],
    ["Branches", "/app/branches", "GET", "/api/v1/branches", NI], ["Organisation", "/app/settings", "GET", "/api/v1/organization", NI],
    ["Settings & branding", "/app/settings", "PUT", "/api/v1/settings", NI], ["Integrations", "/dev/integration-status", "GET", "—", NI], ["Audit log", "/app/audit-log", "GET", "/api/v1/audit-logs", NI],
    ["Departments", "/app/departments", "GET", `${H}/departments`, NI], ["Hospital service catalogue", "/app/hospital-services", "GET", `${H}/services`, NI],
  ]),
  ...noApi("BKP", "Backups", "/app/backups", ["Create", "List", "Download", "Restore", "Verify", "Delete", "Retention"], "/api/v1/system/backups"),
  ...noApi("SYS", "System Health", "/app/system-health", ["Database", "Redis", "Queue workers", "Scheduler", "Storage", "Application", "API"], "/api/v1/system/health"),
  ...group("AI", "AI Assistant", "Assistants", [
    ["Public assistant", "(public pages)", "POST", "/api/v1/assistant/chat", AC, "—"], ["Staff assistant", "/app/assistant", "POST", "/api/v1/assistant/chat", AC],
    ["Patient assistant", "/portal", "POST", "/api/v1/assistant/chat", NI], ["Admin assistant", "/app/assistant", "POST", "/api/v1/assistant/chat", PA],
    ["Knowledge base", "—", "GET", "/api/v1/assistant/knowledge", NI], ["Conversations", "—", "GET", "/api/v1/assistant/conversations", NI], ["Actions", "—", "POST", "/api/v1/assistant/actions", NI],
  ]),
  ...group("DEP", "Deprecated", "Retired concepts", [["Online shop orders", "/app/orders", "—", "—", "DEPRECATED", "view_inventory", "Repurposed as Pharmacy Orders"]]),
];

function hospital(prefix: string, module: string, route: string, features: string[], slug: string): IntegrationEntry[] {
  return group(prefix, module, module, features.map((f): Row => [f, route, "GET", `${H}/${slug}/${f.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`, NI, `view_${slug}`, "Proposed contract; development data in UI"]));
}
function noApi(prefix: string, module: string, route: string, features: string[], base: string): IntegrationEntry[] {
  return group(prefix, module, module, features.map((f): Row => [f, route, "GET", `${base}/${f.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`, NI, "authenticated", "No Laravel JSON API"]));
}

/** Status is derived: only a passing verification may produce LIVE_API; a failing one produces BLOCKED. */
export function resolve(e: IntegrationEntry): ResolvedEntry {
  const v = results[e.id];
  if (v?.ok && Object.values(v.checks).every(Boolean) && (e.declared === "API_CONNECTED" || e.declared === "PARTIAL_API")) return { ...e, status: e.declared === "PARTIAL_API" ? "PARTIAL_API" : "LIVE_API", lastVerified: v.at };
  if (v && !v.ok && e.declared === "API_CONNECTED") return { ...e, status: "BLOCKED", lastVerified: v.at, notes: `${e.notes} Verification failed: ${v.error ?? "unknown"}`.trim() };
  return { ...e, status: e.declared, lastVerified: v?.at ?? null };
}
export const resolvedIntegrations = (): ResolvedEntry[] => integrations.map(resolve);
export const verificationMeta = verification as { generatedAt: string | null; baseUrl: string | null };
