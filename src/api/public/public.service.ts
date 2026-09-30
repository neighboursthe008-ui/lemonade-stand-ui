import { endpoints } from "@/api/registry";
import { request } from "@/api/client/http";

// Field shapes are loose until each is mapped from openapi.yaml in Phase 2.
export interface DentalService { id: number | string; name?: string; title?: string; description?: string | null; price?: string | null }
export interface Doctor { id: number | string; name: string; specialization?: string | null; title?: string | null }

const asList = <T,>(d: unknown): T[] => (Array.isArray(d) ? d : Array.isArray((d as { data?: unknown })?.data) ? (d as { data: T[] }).data : []);

export const publicService = {
  services: async () => asList<DentalService>((await request<unknown>(endpoints.public.services, { auth: false })).data),
  doctors: async () => asList<Doctor>((await request<unknown>(endpoints.public.doctors, { auth: false })).data),
};
