import { moduleByKey } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import type { Row } from "@/modules/types";

/**
 * Public booking + contact. Laravel has no public JSON endpoint for either yet
 * (booking is Blade/session-only; contact is Blade-only). Only the mock exists.
 * When Laravel adds them, implement LaravelPublicRequestService with the same interface.
 */
export interface BookingRequest { service_id: number; service_name: string; clinician_id: number; clinician_name: string; date: string; time: string; guest_name: string; guest_phone: string; guest_email?: string }
export interface ContactRequest { name: string; email: string; phone?: string; subject: string; message: string }
export interface SubmitResult { reference: string; development: boolean; message: string }
export interface PublicRequestService { book(r: BookingRequest): Promise<SubmitResult>; contact(r: ContactRequest): Promise<SubmitResult> }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 1;

export const MockPublicRequestService: PublicRequestService = {
  async book(r) {
    await wait(600);
    const rows = mockRows(moduleByKey("appointments")!);
    const id = Math.max(0, ...rows.map((x) => x.id)) + 1;
    rows.unshift({ id, scheduled_at: new Date(`${r.date}T${r.time}:00`).toISOString(), patient_name: `${r.guest_name} (online request)`, phone: r.guest_phone, service_name: r.service_name, clinician_name: r.clinician_name, status: "scheduled", notes: "Public website request (development)" } as Row);
    const reference = `WEB-${String(seq++).padStart(4, "0")}`;
    return { reference, development: true, message: "Request saved in development mode only. It has NOT been sent to the clinic system." };
  },
  async contact() {
    await wait(500);
    const rows = mockRows(moduleByKey("notifications")!);
    const id = Math.max(0, ...rows.map((x) => x.id)) + 1;
    rows.unshift({ id, title: "New website message (development)", category: "system", read: false, created_at: new Date().toISOString() } as Row);
    return { reference: `MSG-${String(seq++).padStart(4, "0")}`, development: true, message: "Message stored in development mode only. It has NOT been delivered to the clinic." };
  },
};

export const getPublicRequestService = (): PublicRequestService => MockPublicRequestService;
