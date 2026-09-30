import { ApiError } from "@/api/client/http";
import type { PatientRepository } from "@/repositories/patients";
import type { Patient, PatientInput } from "@/types/patient";

// Deterministic mock patients (negative ids never collide with production). In-memory only.
const first = ["Mary", "Peter", "Sarah", "John", "Grace", "James", "Faith", "David", "Esther", "Brian", "Lucy", "Kevin", "Mercy", "Samuel", "Joy"];
const last = ["Njeri", "Kamau", "Wanjiku", "Kariuki", "Achieng", "Otieno", "Mwangi", "Wambui", "Mutua", "Chebet", "Odhiambo", "Muthoni"];
const groups = ["O+", "A+", "B+", "O-", "AB+", null];

function build(i: number): Patient {
  const f = first[i % first.length]!, l = last[(i * 7) % last.length]!;
  const year = 1960 + ((i * 3) % 55);
  return {
    id: -(1000 + i), patient_number: `LDC-${String(1001 + i).padStart(5, "0")}`,
    first_name: f, middle_name: null, last_name: l, full_name: `${f} ${l}`,
    date_of_birth: `${year}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`, age: 2026 - year,
    gender: i % 2 ? "male" : "female", phone: `07${String(10000000 + i * 137911).slice(0, 8)}`, alternate_phone: null,
    email: i % 3 ? `${f}.${l}${i}@example.com`.toLowerCase() : null, address: i % 4 ? "Kerugoya, Kirinyaga" : null,
    emergency_contact: { name: i % 2 ? `${first[(i + 3) % first.length]} ${l}` : null, phone: i % 2 ? "0711000000" : null, relationship: i % 2 ? "Spouse" : null },
    next_of_kin: { name: null, phone: null, relationship: null },
    referral_source: i % 5 === 0 ? "Walk-in" : null, notes: null,
    allergies: i % 6 === 0 ? "Penicillin" : null, medical_history: i % 7 === 0 ? "Hypertension" : null, current_medications: null,
    blood_group: groups[i % groups.length] ?? null, care_status: null, has_insurance: i % 3 === 0,
    is_active: i % 11 !== 0, is_portal_active: false, outstanding_balance: String(i % 4 === 0 ? (i * 350) % 9000 : 0),
    branch_id: i % 3 === 0 ? -2 : -1, registered_at: `2026-0${(i % 9) + 1}-1${i % 9}T09:00:00+03:00`, created_at: null,
  };
}

let store: Patient[] = Array.from({ length: 42 }, (_, i) => build(i));
let nextId = -2000;

function fromInput(id: number, number: string, x: PatientInput, prev?: Patient): Patient {
  const dob = x.date_of_birth || null;
  return {
    ...(prev ?? build(0)), id, patient_number: number,
    first_name: x.first_name, middle_name: x.middle_name || null, last_name: x.last_name,
    full_name: [x.first_name, x.middle_name, x.last_name].filter(Boolean).join(" "),
    date_of_birth: dob, age: dob ? 2026 - Number(dob.slice(0, 4)) : null, gender: x.gender ?? null,
    phone: x.phone, alternate_phone: x.alternate_phone || null, email: x.email || null, address: x.address || null,
    emergency_contact: { name: x.emergency_contact_name || null, phone: x.emergency_contact_phone || null, relationship: x.emergency_contact_relationship || null },
    next_of_kin: { name: x.next_of_kin_name || null, phone: x.next_of_kin_phone || null, relationship: x.next_of_kin_relationship || null },
    referral_source: x.referral_source || null, notes: x.notes || null, allergies: x.allergies || null,
    medical_history: x.medical_history || null, current_medications: x.current_medications || null,
    blood_group: x.blood_group || null, has_insurance: !!x.has_insurance, branch_id: x.branch_id,
    is_active: prev?.is_active ?? true, outstanding_balance: prev?.outstanding_balance ?? "0",
  };
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

export const MockPatientRepository: PatientRepository = {
  source: "mock",
  async list({ page = 1, per_page = 15, search, status, branch_id }) {
    const q = search?.toLowerCase().trim();
    const rows = store.filter((p) =>
      (!q || [p.first_name, p.last_name, p.phone, p.email ?? "", p.patient_number].some((v) => v.toLowerCase().includes(q))) &&
      (!status || (status === "active" ? p.is_active : !p.is_active)) &&
      (!branch_id || p.branch_id === branch_id));
    const lastPage = Math.max(1, Math.ceil(rows.length / per_page));
    return delay({ items: rows.slice((page - 1) * per_page, page * per_page), page, lastPage, total: rows.length });
  },
  async get(id) {
    const p = store.find((x) => x.id === id);
    if (!p) throw new ApiError("Patient not found", { status: 404, kind: "not_found" } as never);
    return delay(p);
  },
  async create(input) {
    const p = fromInput(nextId--, `LDC-${String(1001 + store.length).padStart(5, "0")}`, input);
    store = [p, ...store];
    return delay(p);
  },
  async update(id, input) {
    const prev = store.find((x) => x.id === id);
    if (!prev) throw new ApiError("Patient not found", { status: 404, kind: "not_found" } as never);
    const p = fromInput(id, prev.patient_number, input, prev);
    store = store.map((x) => (x.id === id ? p : x));
    return delay(p);
  },
  consultations: async (id) => delay(Math.abs(id) % 2 ? [
    { id: 1, consulted_at: "2026-09-12T10:30:00+03:00", reason: "Toothache, lower left molar", clinical_notes: "Deep caries on 36. Recommended root canal.", status: "completed" },
    { id: 2, consulted_at: "2026-06-03T09:00:00+03:00", reason: "Routine check-up", clinical_notes: "Mild plaque. Scaling done.", status: "completed" },
  ] : []),
  prescriptions: async (id) => delay(Math.abs(id) % 2 ? [
    { id: 1, created_at: "2026-09-12T11:00:00+03:00", status: "dispensed", items: [
      { id: 1, drug_name: "Amoxicillin 500mg", dosage: "1 capsule", frequency: "3 times daily", duration: "5 days" },
      { id: 2, drug_name: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "as needed", duration: "3 days" },
    ] },
  ] : []),
  vitals: async () => delay([
    { id: 1, created_at: "2026-09-12T10:20:00+03:00", bp: "124/82", pulse: 76, temperature: "36.7", weight: "68.0", oxygen_saturation: 98 },
    { id: 2, created_at: "2026-06-03T08:50:00+03:00", bp: "120/80", pulse: 72, temperature: "36.5", weight: "67.2", oxygen_saturation: 99 },
  ]),
};
