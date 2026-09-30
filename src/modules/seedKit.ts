// Deterministic helpers for fictional development data. No Math.random, no real people.
import { mockPatientList } from "@/mocks/patients/MockPatientRepository";

export const DENTISTS = [
  { id: -201, name: "Dr. Mwangi (dev)" },
  { id: -202, name: "Dr. Achieng (dev)" },
  { id: -203, name: "Dr. Grace (dev)" },
  { id: -204, name: "Dr. Otieno (dev)" },
];
export const SERVICES = ["General Consultation", "Dental Cleaning", "Root Canal", "Tooth Extraction", "Filling", "Orthodontic Review", "Teeth Whitening", "Dental X-ray"];

export const pick = <T,>(arr: readonly T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length]!;
export const patientAt = (i: number) => { const list = mockPatientList(); const p = pick(list, i * 7 + 3); return { patient_id: p.id, patient_name: p.full_name }; };
export const dentistAt = (i: number) => { const d = pick(DENTISTS, i); return { clinician_id: d.id, clinician_name: d.name }; };

const BASE = Date.UTC(2026, 8, 30, 6, 0); // 30 Sep 2026 09:00 EAT
export const at = (dayOffset: number, hour = 9, minute = 0) => new Date(BASE + dayOffset * 864e5 + (hour - 9) * 36e5 + minute * 6e4).toISOString();
export const day = (dayOffset: number) => at(dayOffset).slice(0, 10);
export const money = (i: number, base: number, step = 250) => base + ((i * 37) % 12) * step;
export const code = (prefix: string, i: number, width = 4) => `${prefix}-${String(i + 1).padStart(width, "0")}`;

export function resolveNames(values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (values["patient_id"] != null) {
    const p = mockPatientList().find((x) => x.id === Number(values["patient_id"]));
    if (p) out["patient_name"] = p.full_name;
  }
  for (const k of ["clinician_id", "dentist_id"]) {
    if (values[k] != null) {
      const d = DENTISTS.find((x) => x.id === Number(values[k]));
      if (d) out[k === "dentist_id" ? "dentist_name" : "clinician_name"] = d.name;
    }
  }
  return out;
}
