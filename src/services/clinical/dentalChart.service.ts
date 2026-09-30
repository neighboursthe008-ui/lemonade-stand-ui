import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";
import { moduleByKey } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import type { Row } from "@/modules/types";

/** Mirrors DentalChartController::getPatientChart (entries grouped by tooth) and batchUpdate. */
export interface ToothEntry { id?: number; tooth_number: number; tooth_surface?: string | null; condition_type: string; notes?: string | null; date_recorded?: string | null }
export interface DentalChartService { readonly source: "api" | "mock"; get(patientId: number): Promise<ToothEntry[]>; save(patientId: number, entries: ToothEntry[]): Promise<string> }

export const SURFACES = ["buccal", "lingual", "mesial", "distal", "occlusal", "incisal", "palatal", "facial", "root"] as const;
export const CONDITIONS = ["healthy", "caries", "filled", "missing", "crown", "root_canal", "fractured", "implant", "extraction_planned"] as const;

const LaravelDentalChartService: DentalChartService = {
  source: "api",
  async get(patientId) {
    const d = (await request<unknown>(endpoints.patients.dentalChart(patientId))).data;
    if (Array.isArray(d)) return d as ToothEntry[];
    if (d && typeof d === "object") return Object.entries(d as Record<string, ToothEntry[]>).flatMap(([t, es]) => (Array.isArray(es) ? es.map((e) => ({ ...e, tooth_number: Number(t) })) : []));
    return [];
  },
  async save(patientId, entries) {
    const r = await request<unknown>(endpoints.patients.dentalChartBatch(patientId), { method: "PUT", body: { entries } });
    return r.message ?? "Dental chart saved";
  },
};

const MockDentalChartService: DentalChartService = {
  source: "mock",
  get: async (patientId) => mockRows(moduleByKey("dental-chart")!).filter((r) => r["patient_id"] === patientId).map((r) => ({ id: r.id, tooth_number: Number(r["tooth_number"]), condition_type: String(r["condition_type"]), notes: (r["notes"] as string) ?? null, tooth_surface: (r["tooth_surface"] as string) ?? null })),
  async save(patientId, entries) {
    const rows = mockRows(moduleByKey("dental-chart")!);
    let next = Math.max(0, ...rows.map((r) => r.id)) + 1;
    entries.forEach((e) => rows.unshift({ id: next++, patient_id: patientId, tooth_number: e.tooth_number, condition_type: e.condition_type, tooth_surface: e.tooth_surface ?? null, notes: e.notes ?? null, updated_at: new Date().toISOString() } as Row));
    return "Chart saved to development data only — not sent to the clinic system.";
  },
};

export const getDentalChartService = (isDevSession: boolean): DentalChartService => (isDevSession ? MockDentalChartService : LaravelDentalChartService);
