import type { DashboardData, DashboardRepository } from "@/repositories/dashboard";

// Deterministic mock data — fixed values, no randomness.
const byRole: Record<string, Pick<DashboardData, "kpis">> = {
  super_admin: { kpis: [
    { key: "patients", label: "Active patients", value: "1,284", hint: "all branches" },
    { key: "appts", label: "Appointments today", value: "37", hint: "9 checked in" },
    { key: "revenue", label: "Revenue this month", value: "KSh 842,500.00", hint: "mock figure" },
    { key: "outstanding", label: "Outstanding balances", value: "KSh 126,300.00", hint: "42 patients" },
  ] },
  dentist: { kpis: [
    { key: "queue", label: "Waiting for you", value: "4", hint: "longest 18 min" },
    { key: "seen", label: "Seen today", value: "6", hint: "2 procedures" },
    { key: "lab", label: "Lab results pending", value: "3", hint: "" },
    { key: "rx", label: "Prescriptions issued", value: "5", hint: "today" },
  ] },
  receptionist: { kpis: [
    { key: "appts", label: "Appointments today", value: "37", hint: "5 unconfirmed" },
    { key: "checkins", label: "Checked in", value: "9", hint: "" },
    { key: "new", label: "New registrations", value: "4", hint: "today" },
    { key: "noshow", label: "No-shows", value: "2", hint: "today" },
  ] },
  cashier: { kpis: [
    { key: "collected", label: "Collected today", value: "KSh 48,200.00", hint: "mock figure" },
    { key: "mpesa", label: "M-Pesa payments", value: "14", hint: "" },
    { key: "open", label: "Open invoices", value: "23", hint: "" },
    { key: "refunds", label: "Refund requests", value: "1", hint: "" },
  ] },
  inventory_manager: { kpis: [
    { key: "low", label: "Low stock items", value: "7", hint: "" },
    { key: "expiry", label: "Expiring in 30 days", value: "3", hint: "batches" },
    { key: "po", label: "Open purchase orders", value: "2", hint: "" },
    { key: "orders", label: "Shop orders to pack", value: "5", hint: "" },
  ] },
};

const activity = [
  { id: "mock-act-1", at: "08:12", text: "Jane W. checked in for a scaling appointment", kind: "clinical" as const },
  { id: "mock-act-2", at: "08:40", text: "Invoice INV-MOCK-0042 issued (KSh 3,500.00)", kind: "billing" as const },
  { id: "mock-act-3", at: "09:05", text: "Lidocaine 2% dropped below reorder level", kind: "inventory" as const },
  { id: "mock-act-4", at: "09:22", text: "Dr. Otieno completed consultation for Brian O.", kind: "clinical" as const },
  { id: "mock-act-5", at: "10:01", text: "New staff user created: nurse.kilimani", kind: "admin" as const },
  { id: "mock-act-6", at: "10:18", text: "M-Pesa payment received from Amina H.", kind: "billing" as const },
];

export const MockDashboardRepository: DashboardRepository = {
  source: "mock",
  async forRole(role) {
    return {
      kpis: (byRole[role] ?? byRole["super_admin"])?.kpis ?? [],
      activity,
      appointmentsByDay: [
        { day: "Mon", count: 28 }, { day: "Tue", count: 34 }, { day: "Wed", count: 31 },
        { day: "Thu", count: 37 }, { day: "Fri", count: 40 }, { day: "Sat", count: 22 },
      ],
    };
  },
};
