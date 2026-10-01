import { CalendarDays, Clock, Stethoscope, HeartPulse, Smile, ClipboardList, Pill, FlaskConical, ScanLine } from "lucide-react";
import { endpoints } from "@/api/registry";
import type { ModuleConfig } from "../types";
import { at, code, dentistAt, patientAt, pick, SERVICES } from "../seedKit";

const APPT_STATUS = ["scheduled", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"] as const;
const QUEUE_BLOCK = "Development workflow — Laravel queue orchestration pending. No real consultation was created.";

export const clinicalModules: ModuleConfig[] = [
  {
    key: "appointments", title: "Appointments", singular: "Appointment", section: "Clinical", icon: CalendarDays,
    description: "Book, confirm, check in and track visits.", permission: "view_appointments", managePermission: "create_appointments",
    columns: [
      { key: "scheduled_at", label: "When", format: "datetime" }, { key: "patient_name|patient.full_name|name", label: "Patient" },
      { key: "service_name|service.name", label: "Service", hideOnMobile: true }, { key: "clinician_name|clinician.name", label: "Clinician", hideOnMobile: true },
      { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "scheduled_at", label: "Date & time", type: "datetime", required: true },
      { name: "clinician_id", label: "Clinician", type: "dentist" },
      { name: "service_name", label: "Service", type: "select", options: SERVICES },
      { name: "notes", label: "Notes", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: APPT_STATUS }],
    actions: [
      { key: "confirm", label: "Confirm", to: "confirmed", when: (r) => r["status"] === "scheduled" },
      { key: "checkIn", label: "Check in", to: "checked_in", when: (r) => ["scheduled", "confirmed"].includes(String(r["status"])) },
      { key: "addToQueue", label: "Add to waiting list", when: (r) => r["status"] === "checked_in", mock: () => ({ queued: true }) },
      { key: "reschedule", label: "Reschedule", fields: [{ name: "scheduled_at", label: "New date & time", type: "datetime", required: true }], when: (r) => !["completed", "cancelled", "no_show"].includes(String(r["status"])) },
      { key: "noShow", label: "Mark no-show", to: "no_show", confirm: "Mark this patient as a no-show?", when: (r) => ["scheduled", "confirmed"].includes(String(r["status"])) },
      { key: "cancel", label: "Cancel", to: "cancelled", danger: true, fields: [{ name: "cancellation_reason", label: "Reason", type: "textarea", required: true }], when: (r) => !["completed", "cancelled", "no_show"].includes(String(r["status"])) },
    ],
    canCreate: true, canEdit: (r) => !["completed", "cancelled"].includes(String(r["status"])), canDelete: false,
    laravel: {
      list: endpoints.appointments.list, detail: endpoints.appointments.detail, create: true, update: true,
      actions: { confirm: endpoints.appointments.confirm, checkIn: endpoints.appointments.checkIn, cancel: endpoints.appointments.cancel, noShow: endpoints.appointments.noShow, addToQueue: endpoints.appointments.addToQueue, reschedule: endpoints.appointments.detail },
    },
    seedCount: 140,
    seed: (i) => ({ ...patientAt(i), ...dentistAt(i), scheduled_at: at((i % 21) - 10, 8 + (i % 9), (i % 2) * 30), service_name: pick(SERVICES, i), status: i % 21 < 10 ? pick(["completed", "completed", "no_show", "cancelled"], i) : pick(["scheduled", "confirmed", "checked_in", "confirmed"], i), notes: null }),
  },
  {
    key: "queue", title: "Waiting List", singular: "Queue entry", section: "Clinical", icon: Clock,
    description: "Today's waiting list and clinical queue.", permission: "view_queue", managePermission: "view_queue",
    workflowNote: QUEUE_BLOCK,
    columns: [
      { key: "queue_number", label: "#" }, { key: "patient_name|patient.full_name", label: "Patient" },
      { key: "priority", label: "Priority", format: "status" }, { key: "dentist_name|dentist.name", label: "Clinician", hideOnMobile: true },
      { key: "joined_at", label: "Joined", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "priority", label: "Priority", type: "select", options: ["Normal", "Emergency"] },
      { name: "dentist_id", label: "Clinician", type: "dentist" },
      { name: "notes", label: "Notes", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["waiting", "called", "in_consultation", "completed", "skipped"] }],
    actions: [
      { key: "call", label: "Call patient", to: "called", when: (r) => r["status"] === "waiting" },
      { key: "assignDentist", label: "Assign clinician", fields: [{ name: "dentist_id", label: "Clinician", type: "dentist", required: true }], when: (r) => !["completed", "skipped"].includes(String(r["status"])) },
      { key: "start", label: "Start consultation", to: "in_consultation", mockOnly: QUEUE_BLOCK, when: (r) => r["status"] === "called" },
      { key: "complete", label: "Complete", to: "completed", when: (r) => r["status"] === "in_consultation" },
      { key: "skip", label: "Skip", to: "skipped", fields: [{ name: "reason", label: "Reason", type: "text" }], when: (r) => ["waiting", "called"].includes(String(r["status"])) },
    ],
    pageActions: [{
      key: "callNext", label: "Call next patient", permission: "view_queue",
      mock: (rows) => {
        const next = [...rows].reverse().find((r) => r["status"] === "waiting");
        if (!next) return { rows, message: "Nobody is waiting." };
        return { rows: rows.map((r) => (r.id === next.id ? { ...r, status: "called" } : r)), message: `Called ${String(next["patient_name"])} (#${String(next["queue_number"])}).` };
      },
    }],
    canCreate: true, canEdit: false, canDelete: true,
    laravel: {
      list: endpoints.queue.list, detail: endpoints.queue.detail, create: true, remove: true,
      actions: { call: endpoints.queue.call, complete: endpoints.queue.complete, skip: endpoints.queue.skip, assignDentist: endpoints.queue.assignDentist },
      pageActions: { callNext: endpoints.queue.callNext },
    },
    seedCount: 14,
    seed: (i) => ({ ...patientAt(i + 40), queue_number: String(14 - i).padStart(2, "0"), priority: i === 3 ? "Emergency" : "Normal", dentist_id: null, dentist_name: null, joined_at: at(0, 8 + Math.floor((14 - i) / 3), ((14 - i) * 7) % 60), status: i < 8 ? "waiting" : pick(["called", "in_consultation", "completed", "completed"], i) }),
  },
  {
    key: "consultations", title: "Consultations", singular: "Consultation", section: "Clinical", icon: Stethoscope,
    description: "SOAP notes and consultation history.", permission: "view_consultations", managePermission: "view_consultations",
    columns: [
      { key: "consulted_at", label: "Date", format: "datetime" }, { key: "patient_name|patient.full_name", label: "Patient" },
      { key: "reason", label: "Reason", hideOnMobile: true }, { key: "clinician_name|clinician.name", label: "Clinician", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "reason", label: "Reason for visit", type: "text", required: true },
      { name: "subjective", label: "Subjective (S)", type: "textarea", wide: true },
      { name: "objective", label: "Objective (O)", type: "textarea", wide: true },
      { name: "assessment", label: "Assessment (A)", type: "textarea", wide: true },
      { name: "plan", label: "Plan (P)", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["in_progress", "completed"] }],
    actions: [{ key: "complete", label: "Complete consultation", to: "completed", confirm: "Complete and lock this consultation?", when: (r) => r["status"] === "in_progress" }],
    canCreate: true, canEdit: (r) => r["status"] !== "completed",
    laravel: { list: endpoints.consultations.list, detail: endpoints.consultations.detail, create: true, update: true, actions: { complete: endpoints.consultations.complete } },
    seedCount: 90,
    seed: (i) => ({ ...patientAt(i), ...dentistAt(i), consulted_at: at(-(i % 60), 9 + (i % 7)), reason: pick(["Toothache", "Routine check-up", "Bleeding gums", "Broken tooth", "Sensitivity"], i), subjective: "Patient reports discomfort.", objective: "Examined oral cavity.", assessment: pick(["Dental caries", "Gingivitis", "Healthy"], i), plan: pick(["Filling", "Scaling", "Review in 6 months"], i), status: i < 3 ? "in_progress" : "completed" }),
  },
  {
    key: "vitals", title: "Vitals", singular: "Vitals record", section: "Clinical", icon: HeartPulse,
    description: "Blood pressure, pulse, temperature and more.", permission: "view_consultations", managePermission: "collect_vitals",
    columns: [
      { key: "created_at", label: "Recorded", format: "datetime" }, { key: "patient_name|patient.full_name", label: "Patient" },
      { key: "bp", label: "BP" }, { key: "pulse", label: "Pulse" }, { key: "temperature", label: "Temp °C", hideOnMobile: true }, { key: "weight", label: "Weight kg", hideOnMobile: true },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "bp", label: "Blood pressure (e.g. 120/80)", type: "text", required: true },
      { name: "pulse", label: "Pulse (bpm)", type: "number", min: 20 }, { name: "temperature", label: "Temperature °C", type: "number", min: 30 },
      { name: "weight", label: "Weight kg", type: "number", min: 1 }, { name: "height", label: "Height cm", type: "number", min: 30 },
      { name: "oxygen_saturation", label: "SpO₂ %", type: "number", min: 50 }, { name: "notes", label: "Notes", type: "textarea", wide: true },
    ],
    canCreate: true, canEdit: true, canDelete: true,
    laravel: { list: endpoints.vitals.list, detail: endpoints.vitals.detail, create: true, update: true, remove: true },
    seedCount: 80,
    seed: (i) => ({ ...patientAt(i), created_at: at(-(i % 60), 8 + (i % 8)), bp: `${110 + (i % 30)}/${70 + (i % 15)}`, pulse: 62 + (i % 30), temperature: (36.2 + (i % 8) / 10).toFixed(1), weight: 55 + (i % 35), height: 150 + (i % 35), oxygen_saturation: 95 + (i % 5), notes: null }),
  },
  {
    key: "dental-chart", title: "Dental Chart", singular: "Chart entry", section: "Dental", icon: Smile,
    description: "Tooth conditions and procedures. Open a patient to use the full odontogram.", permission: "view_dental_chart", managePermission: "edit_dental_chart",
    columns: [
      { key: "patient_name|patient.full_name", label: "Patient" }, { key: "tooth_number", label: "Tooth" },
      { key: "condition_type", label: "Condition", format: "status" }, { key: "procedure", label: "Procedure", hideOnMobile: true }, { key: "updated_at", label: "Updated", format: "date", hideOnMobile: true },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "tooth_number", label: "Tooth (FDI, e.g. 36)", type: "number", required: true, min: 11 },
      { name: "condition_type", label: "Condition", type: "select", options: ["healthy", "caries", "filled", "missing", "crown", "root_canal", "fractured", "implant"], required: true },
      { name: "procedure", label: "Procedure", type: "text" }, { name: "notes", label: "Notes", type: "textarea", wide: true },
    ],
    canCreate: true, canEdit: true, canDelete: true,
    laravel: { list: endpoints.dentalChart.list, detail: endpoints.dentalChart.detail },
    backendNote: "Chart writes use the per-patient batch endpoint on the patient page.",
    seedCount: 60,
    seed: (i) => ({ ...patientAt(i % 20), tooth_number: pick([11, 16, 21, 26, 36, 46, 47, 37, 14, 24], i), condition_type: pick(["caries", "filled", "missing", "crown", "root_canal"], i), procedure: pick(["Composite filling", "Extraction", "Crown fitted", "RCT", null], i), notes: null, updated_at: at(-(i % 90)) }),
  },
  {
    key: "treatment-plans", title: "Treatment Plans", singular: "Treatment plan", section: "Clinical", icon: ClipboardList,
    description: "Multi-visit plans with estimated cost.", permission: "view_consultations", managePermission: "view_consultations",
    backendNote: "No treatment plan JSON API in the clinic system yet.",
    columns: [
      { key: "title", label: "Plan" }, { key: "patient_name", label: "Patient" }, { key: "estimated_cost", label: "Estimate", format: "money", hideOnMobile: true },
      { key: "visits", label: "Visits", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "title", label: "Plan title", type: "text", required: true },
      { name: "estimated_cost", label: "Estimated cost (KSh)", type: "money", min: 0 }, { name: "visits", label: "Planned visits", type: "number", min: 1 },
      { name: "description", label: "Details", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["proposed", "accepted", "in_progress", "completed", "declined"] }],
    actions: [
      { key: "accept", label: "Mark accepted", to: "accepted", when: (r) => r["status"] === "proposed" },
      { key: "start", label: "Start treatment", to: "in_progress", when: (r) => r["status"] === "accepted" },
      { key: "complete", label: "Complete", to: "completed", when: (r) => r["status"] === "in_progress" },
      { key: "decline", label: "Declined by patient", to: "declined", danger: true, confirm: "Record that the patient declined this plan?", when: (r) => r["status"] === "proposed" },
    ],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 30,
    seed: (i) => ({ ...patientAt(i), title: pick(["Full mouth rehabilitation", "Orthodontic braces", "Root canal + crown", "Implant 36"], i), estimated_cost: 15000 + (i % 10) * 7500, visits: 2 + (i % 6), description: null, status: pick(["proposed", "accepted", "in_progress", "completed"], i) }),
  },
  {
    key: "prescriptions", title: "Prescriptions", singular: "Prescription", section: "Clinical", icon: Pill,
    description: "Issue and dispense prescriptions.", permission: "view_prescriptions", managePermission: "create_prescriptions",
    columns: [
      { key: "created_at", label: "Date", format: "date" }, { key: "patient_name|patient.name", label: "Patient" },
      { key: "drug_name", label: "Medication" }, { key: "dosage", label: "Dosage", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "drug_name", label: "Medication", type: "text", required: true },
      { name: "dosage", label: "Dosage", type: "text", required: true }, { name: "frequency", label: "Frequency", type: "text", required: true },
      { name: "duration", label: "Duration", type: "text" }, { name: "quantity", label: "Quantity", type: "number", min: 1 },
      { name: "instructions", label: "Instructions", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["pending", "dispensed", "cancelled"] }],
    actions: [{ key: "dispense", label: "Dispense", to: "dispensed", confirm: "Mark this prescription as dispensed?", when: (r) => r["status"] === "pending" }],
    canCreate: true, canEdit: (r) => r["status"] === "pending",
    laravel: { list: endpoints.prescriptions.list, detail: endpoints.prescriptions.detail, create: true, update: true, actions: { dispense: endpoints.prescriptions.dispense } },
    seedCount: 70,
    seed: (i) => ({ ...patientAt(i), created_at: at(-(i % 45)), drug_name: pick(["Amoxicillin 500mg", "Ibuprofen 400mg", "Metronidazole 400mg", "Chlorhexidine mouthwash", "Paracetamol 1g"], i), dosage: "1 tablet", frequency: pick(["3× daily", "2× daily", "as needed"], i), duration: `${3 + (i % 5)} days`, quantity: 10 + (i % 11), instructions: "After meals", status: i < 6 ? "pending" : "dispensed" }),
  },
  {
    key: "lab-orders", title: "Lab Orders", singular: "Lab order", section: "Clinical", icon: FlaskConical,
    description: "Laboratory tests, samples and results.", permission: "view_lab_orders", managePermission: "view_lab_orders",
    columns: [
      { key: "ordered_at", label: "Ordered", format: "date" }, { key: "patient_name|patient.name", label: "Patient" },
      { key: "test_name|test_details.test_name", label: "Test" }, { key: "text_result|results.text_result", label: "Result", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "test_name", label: "Test", type: "select", options: ["Full blood count", "Blood sugar", "HbA1c", "Clotting profile", "HIV screening", "Culture & sensitivity"], required: true },
      { name: "notes", label: "Clinical notes", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["pending", "sample_collected", "completed", "cancelled"] }],
    actions: [
      { key: "collectSample", label: "Collect sample", to: "sample_collected", when: (r) => r["status"] === "pending" },
      { key: "recordResults", label: "Record results", to: "completed", fields: [{ name: "text_result", label: "Result", type: "textarea", required: true }, { name: "units", label: "Units", type: "text" }], when: (r) => r["status"] === "sample_collected" },
      { key: "cancel", label: "Cancel order", to: "cancelled", danger: true, confirm: "Cancel this lab order?", when: (r) => ["pending", "sample_collected"].includes(String(r["status"])) },
    ],
    canCreate: true, canEdit: false,
    laravel: { list: endpoints.labOrders.list, detail: endpoints.labOrders.detail, create: true, actions: { collectSample: endpoints.labOrders.collectSample, recordResults: endpoints.labOrders.recordResults, cancel: endpoints.labOrders.cancel } },
    seedCount: 45,
    seed: (i) => ({ ...patientAt(i), ordered_at: at(-(i % 30)), test_name: pick(["Full blood count", "Blood sugar", "HbA1c", "Clotting profile"], i), text_result: i < 8 ? null : pick(["Normal", "Within range", "Slightly elevated"], i), notes: null, status: i < 4 ? "pending" : i < 8 ? "sample_collected" : "completed" }),
  },
  {
    key: "radiology", title: "Radiology", singular: "Radiology order", section: "Clinical", icon: ScanLine,
    description: "X-ray and imaging orders and reports.", permission: "view_radiology_orders", managePermission: "view_radiology_orders",
    columns: [
      { key: "ordered_at", label: "Ordered", format: "date" }, { key: "patient_name|patient.name", label: "Patient" },
      { key: "study", label: "Study" }, { key: "findings", label: "Findings", hideOnMobile: true }, { key: "status", label: "Status", format: "status" },
    ],
    fields: [
      { name: "patient_id", label: "Patient", type: "patient", required: true },
      { name: "study", label: "Study", type: "select", options: ["Periapical X-ray", "Bitewing X-ray", "Panoramic (OPG)", "CBCT scan", "Cephalometric X-ray"], required: true },
      { name: "notes", label: "Clinical notes", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["pending", "completed", "cancelled"] }],
    actions: [
      { key: "recordResults", label: "Record findings", to: "completed", fields: [{ name: "findings", label: "Findings", type: "textarea", required: true }], when: (r) => r["status"] === "pending" },
      { key: "cancel", label: "Cancel order", to: "cancelled", danger: true, confirm: "Cancel this radiology order?", when: (r) => r["status"] === "pending" },
    ],
    canCreate: true, canEdit: false,
    laravel: { list: endpoints.radiologyOrders.list, detail: endpoints.radiologyOrders.detail, create: true, actions: { recordResults: endpoints.radiologyOrders.recordResults, cancel: endpoints.radiologyOrders.cancel } },
    seedCount: 35,
    seed: (i) => ({ ...patientAt(i), ordered_at: at(-(i % 30)), study: pick(["Periapical X-ray", "Panoramic (OPG)", "Bitewing X-ray"], i), findings: i < 5 ? null : pick(["Periapical radiolucency on 36", "No abnormality", "Impacted 38"], i), notes: null, status: i < 5 ? "pending" : "completed", code: code("RAD", i) }),
  },
];
