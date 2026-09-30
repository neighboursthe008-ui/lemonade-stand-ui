import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";
import { dataSourceFor } from "@/config/env";
import { MockPatientRepository } from "@/mocks/patients/MockPatientRepository";
import type { ConsultationRow, Page, Patient, PatientInput, PatientListParams, PrescriptionRow, VitalRow } from "@/types/patient";

export interface PatientRepository {
  readonly source: "api" | "mock";
  list(p: PatientListParams): Promise<Page<Patient>>;
  get(id: number): Promise<Patient>;
  create(input: PatientInput): Promise<Patient>;
  update(id: number, input: PatientInput): Promise<Patient>;
  consultations(id: number): Promise<ConsultationRow[]>;
  prescriptions(id: number): Promise<PrescriptionRow[]>;
  vitals(id: number): Promise<VitalRow[]>;
}

const arr = <T,>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : []);

/** Live implementation — only documented Laravel endpoints from the registry. */
export const LaravelPatientRepository: PatientRepository = {
  source: "api",
  async list(p) {
    const r = await request<Patient[]>(endpoints.patients.list, { query: { ...p, branch_id: p.branch_id ?? undefined } });
    return { items: arr<Patient>(r.data), page: r.meta?.current_page ?? 1, lastPage: r.meta?.last_page ?? 1, total: r.meta?.total ?? arr(r.data).length };
  },
  get: async (id) => (await request<Patient>(endpoints.patients.detail(id))).data,
  create: async (input) => (await request<Patient>(endpoints.patients.list, { method: "POST", body: input })).data,
  update: async (id, input) => (await request<Patient>(endpoints.patients.detail(id), { method: "PUT", body: input })).data,
  consultations: async (id) => arr<ConsultationRow>((await request<unknown>(endpoints.patients.consultations(id))).data),
  prescriptions: async (id) => arr<PrescriptionRow>((await request<unknown>(endpoints.patients.prescriptions(id))).data),
  vitals: async (id) => arr<VitalRow>((await request<unknown>(endpoints.patients.vitals(id))).data),
};

/** Dev profiles carry no Laravel token, so they always read the deterministic mock. */
export function getPatientRepository(isDevSession: boolean): PatientRepository {
  if (isDevSession) return MockPatientRepository;
  return dataSourceFor("patients", "api") === "mock" ? MockPatientRepository : LaravelPatientRepository;
}
