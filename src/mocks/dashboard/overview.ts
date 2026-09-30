// Deterministic mock data for the staff dashboard overview — fixed values, no randomness.
export type Range = "7d" | "30d" | "3m" | "12m";

const days = ["Sep 23", "Sep 24", "Sep 25", "Sep 26", "Sep 27", "Sep 28", "Sep 29"];
const c = [36000, 45000, 50000, 48000, 55000, 77000, 66000];
const t = [18000, 25000, 30000, 29000, 34000, 46000, 38000];
const s = [2000, 7000, 11000, 12000, 11000, 16000, 13000];

function scale(n: number | undefined, f: number) { return Math.round((n ?? 0) * f); }

export const revenueByRange: Record<Range, { label: string; consultations: number; treatments: number; shop: number }[]> = {
  "7d": days.map((label, i) => ({ label, consultations: c[i] ?? 0, treatments: t[i] ?? 0, shop: s[i] ?? 0 })),
  "30d": ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((label, i) => ({ label, consultations: scale(c[i + 2], 6), treatments: scale(t[i + 2], 6), shop: scale(s[i + 2], 6) })),
  "3m": ["Jul", "Aug", "Sep"].map((label, i) => ({ label, consultations: scale(c[i + 3], 24), treatments: scale(t[i + 3], 24), shop: scale(s[i + 3], 24) })),
  "12m": ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((label, i) => ({ label, consultations: scale(c[i % 7], 22), treatments: scale(t[i % 7], 22), shop: scale(s[i % 7], 22) })),
};

export const overview = {
  kpis: { patients: 1248, patientsTrend: "+12.4%", appointments: 32, pending: 8, revenue: 86450, revenueTrend: "+8.2%", orders: 18, awaitingPayment: 5 },
  apptBreakdown: [
    { key: "confirmed", label: "Confirmed", value: 22, color: "var(--success)" },
    { key: "waiting", label: "Waiting", value: 5, color: "var(--lemon)" },
    { key: "completed", label: "Completed", value: 4, color: "var(--aqua)" },
    { key: "cancelled", label: "Cancelled", value: 1, color: "var(--destructive)" },
  ],
  schedule: [
    { time: "08:30", patient: "Mary Njeri", service: "General Consultation", provider: "Dr. Mwangi", status: "Confirmed" },
    { time: "09:00", patient: "Peter Kamau", service: "Dental Cleaning", provider: "Dr. Achieng", status: "Checked In" },
    { time: "10:30", patient: "Sarah Wanjiku", service: "Root Canal Consultation", provider: "Dr. Grace", status: "Waiting" },
    { time: "11:15", patient: "John Kariuki", service: "Dental Review", provider: "Dr. Mwangi", status: "Completed" },
  ],
  waiting: [
    { no: "01", patient: "Mary Njeri", time: "09:05", service: "General Dentistry", status: "Waiting" },
    { no: "02", patient: "Peter Kamau", time: "09:18", service: "Dental Cleaning", status: "Waiting" },
    { no: "03", patient: "James Kariuki", time: "09:27", service: "Consultation", status: "Called" },
  ],
  clinical: { waiting: 8, inConsultation: 3, completed: 21, noShows: 2 },
  financial: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, i) => ({
    month: m, revenue: [90, 110, 150, 160, 140, 170][i]! * 1000, expenses: [60, 55, 80, 90, 70, 95][i]! * 1000,
    outstanding: [40, 30, 55, 45, 50, 60][i]! * 1000, payments: [70, 85, 120, 130, 110, 140][i]! * 1000,
  })),
  health: ["Database", "Redis", "Queue Worker", "Scheduler", "Storage", "API"],
  activity: [
    { text: "Patient registered · Mary Wanjiku", at: "0 minutes ago" },
    { text: "Payment received · KSh 3,000", at: "12 minutes ago" },
    { text: "Appointment booked · Peter Kamau", at: "28 minutes ago" },
    { text: "Order created · INV-2026-0098", at: "1 hour ago" },
    { text: "Blog post published · Oral Health Tips", at: "2 hours ago" },
    { text: "Backup completed · Full System Backup", at: "3 hours ago" },
  ],
};
export type Overview = typeof overview;
