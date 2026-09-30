import { moduleByKey } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import { mockPatientList } from "@/mocks/patients/MockPatientRepository";
import type { Row } from "@/modules/types";

/**
 * Patient portal. The Laravel portal is Blade/session-only — no JSON API — so only
 * MockPatientPortalService exists. A LaravelPatientPortalService must implement
 * this same interface once portal endpoints are published.
 */
export interface PortalPatient { id: number; full_name: string; patient_number: string; phone: string; email: string | null }
export type PortalSection = "appointments" | "vitals" | "prescriptions" | "lab-orders" | "radiology" | "invoices" | "payments" | "orders" | "notifications";
export interface PatientPortalService {
  readonly source: "mock";
  login(identifier: string, password: string): Promise<PortalPatient>;
  records(patient: PortalPatient, section: PortalSection): Promise<Row[]>;
  cancelAppointment(id: number): Promise<string>;
  changePassword(current: string, next: string): Promise<string>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rowsOf = (k: string) => mockRows(moduleByKey(k)!);

export const MockPatientPortalService: PatientPortalService = {
  source: "mock",
  async login(identifier, password) {
    await wait(400);
    const id = identifier.trim().toLowerCase();
    const p = mockPatientList().find((x) => x.phone === identifier.trim() || (x.email ?? "").toLowerCase() === id || x.patient_number.toLowerCase() === id);
    if (!p || password.length < 6) throw new Error("No development patient matches these details (password: any 6+ characters).");
    return { id: p.id, full_name: p.full_name, patient_number: p.patient_number, phone: p.phone, email: p.email ?? null };
  },
  async records(p, section) {
    await wait(150);
    if (section === "orders") return rowsOf("orders").filter((r) => r["patient_id"] === p.id || String(r["patient_name"]).startsWith(p.full_name));
    if (section === "notifications") return rowsOf("notifications").slice(0, 8);
    return rowsOf(section).filter((r) => r["patient_id"] === p.id);
  },
  async cancelAppointment(id) {
    await wait(300);
    const r = rowsOf("appointments").find((x) => x.id === id);
    if (!r) throw new Error("Appointment not found");
    if (!["scheduled", "confirmed"].includes(String(r["status"]))) throw new Error("Only upcoming appointments can be cancelled");
    r["status"] = "cancelled";
    return "Appointment cancelled in development data only.";
  },
  async changePassword(current, next) {
    await wait(300);
    if (current.length < 6) throw new Error("Current password is incorrect");
    if (next.length < 8) throw new Error("New password must be at least 8 characters");
    return "Password change simulated — no clinic account was changed.";
  },
};
export const getPatientPortalService = (): PatientPortalService => MockPatientPortalService;
