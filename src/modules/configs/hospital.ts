import {
  Building, Stethoscope, Siren, BedDouble, BedSingle, DoorOpen, ClipboardPlus, HeartPulse, Pill, Syringe, ArrowRightLeft, LogOut as Discharge,
  Baby, Ruler, Scissors, ShieldPlus, FileCheck2, FileBadge, UserSquare2, Briefcase, CalendarCheck, CalendarOff, Wallet, FileQuestion, PackageCheck,
  ClipboardList, Gavel, MessageSquareText, MessagesSquare, Send, ListChecks, Share2, Microscope,
} from "lucide-react";
import type { ActionDef, FieldDef, ModuleConfig } from "../types";
import { at, code, day, dentistAt, money, patientAt, pick } from "../seedKit";

/**
 * Munab Nursing Home hospital modules. None of these have a Laravel JSON API yet,
 * so every module runs on the isolated mock service (development data only).
 * When Laravel exposes an API, add a `laravel` binding — the UI does not change.
 */
const PENDING = "Backend API pending — Munab hospital module runs on development data only.";
const DEPTS = ["OPD", "Emergency", "Dental & Oral Health", "Paediatrics", "Maternity", "Laboratory", "Radiology", "Pharmacy", "Theatre", "Inpatient", "Physiotherapy", "Nutrition", "Administration", "Finance", "HR", "Procurement"] as const;
const WARDS = ["General Ward A", "General Ward B", "Maternity Ward", "Paediatric Ward", "Private Wing"] as const;
const SHIFTS = ["morning", "evening", "night"] as const;
const t = (name: string, label: string, required = false): FieldDef => ({ name, label, type: "text", required });
const sel = (name: string, label: string, options: readonly string[], required = true): FieldDef => ({ name, label, type: "select", options, required });
const note = (name: string, label: string, required = false): FieldDef => ({ name, label, type: "textarea", required, wide: true });
const pat: FieldDef = { name: "patient_id", label: "Patient", type: "patient", required: true };
const doc: FieldDef = { name: "clinician_id", label: "Clinician", type: "dentist" };

type Base = Pick<ModuleConfig, "key" | "title" | "singular" | "section" | "icon" | "description" | "columns" | "fields" | "seed" | "seedCount"> & Partial<ModuleConfig>;
const mod = (m: Base): ModuleConfig => ({ canCreate: true, canEdit: true, backendNote: PENDING, ...m });
const flow = (steps: string[], danger?: string): ActionDef[] => {
  const out: ActionDef[] = steps.slice(1).map((next, i): ActionDef => ({ key: `to-${next}`, label: `Mark ${next.replace(/_/g, " ")}`, to: next, when: (r) => r["status"] === steps[i] }));
  if (danger) out.push({ key: "cancel", label: danger, to: "cancelled", danger: true, when: (r) => !["cancelled", steps[steps.length - 1]].includes(String(r["status"])) });
  return out;
};
const status = (label = "Status", opts: readonly string[]) => [{ key: "status", label, options: opts }];

const P = "view_patients", C = "view_consultations", N = "view_wards", RX = "view_pharmacy", INV = "view_inventory", FIN = "view_insurance", HR = "view_hr", PROC = "view_procurement";

export const hospitalModules: ModuleConfig[] = [
  // ---------- Administration: departments + service catalogue ----------
  mod({
    key: "departments", title: "Departments", singular: "Department", section: "Administration", icon: Building, permission: "manage_settings",
    description: "Hospital departments, heads, locations and contacts. Dental & Oral Health is one of them.",
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Department" }, { key: "head", label: "Head", hideOnMobile: true }, { key: "location", label: "Location", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Name", true), t("code", "Code", true), t("head", "Department head"), t("location", "Location"), { name: "contact", label: "Contact phone", type: "tel" }, sel("status", "Status", ["active", "inactive"]), note("description", "Description")],
    canDelete: true, seedCount: DEPTS.length,
    seed: (i) => ({ name: DEPTS[i]!, code: DEPTS[i]!.slice(0, 3).toUpperCase() + (i + 1), head: `${pick(["Dr.", "Sr.", "Mr.", "Ms."], i)} ${pick(["Wanjiru", "Kiprono", "Atieno", "Mutua", "Chebet"], i)} (dev)`, location: `Block ${pick(["A", "B", "C"], i)}, floor ${i % 3}`, contact: null, status: "active", description: null }),
  }),
  mod({
    key: "hospital-services", title: "Service Catalogue", singular: "Service", section: "Administration", icon: ClipboardList, permission: "manage_settings",
    description: "Billable services per department. Prices here are development placeholders, not tariffs.",
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Service" }, { key: "department", label: "Department", hideOnMobile: true }, { key: "price", label: "Cash price", format: "money" }, { key: "insurance_price", label: "Insurance", format: "money", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Name", true), t("code", "Code", true), sel("department", "Department", DEPTS), { name: "price", label: "Cash price (KSh)", type: "money", required: true, min: 0 }, { name: "insurance_price", label: "Insurance price (KSh)", type: "money", min: 0 }, { name: "duration_minutes", label: "Duration (min)", type: "number", min: 0 }, sel("status", "Status", ["active", "inactive"]), note("description", "Description")],
    filters: [{ key: "department", label: "Department", options: DEPTS }], canDelete: true, seedCount: 14,
    seed: (i) => ({ name: pick(["OPD Consultation", "Specialist Consultation", "Emergency Consultation", "Dental Consultation", "Full Haemogram", "Chest X-Ray", "Obstetric Ultrasound", "Physiotherapy Session", "Nutrition Review", "Bed Day — General Ward", "Minor Procedure", "Antenatal Visit", "Paediatric Review", "Wound Dressing"], i), code: code("SRV", i), department: pick(["OPD", "OPD", "Emergency", "Dental & Oral Health", "Laboratory", "Radiology", "Radiology", "Physiotherapy", "Nutrition", "Inpatient", "Theatre", "Maternity", "Paediatrics", "OPD"], i), price: money(i, 500, 250), insurance_price: money(i, 700, 250), duration_minutes: 15 + (i % 4) * 15, status: "active" }),
  }),

  // ---------- Patient care ----------
  mod({
    key: "opd", title: "OPD Visits", singular: "OPD visit", section: "Patient Care", icon: Stethoscope, permission: P,
    description: "Outpatient journey: check-in → triage → consultation → investigations → billing → discharge.",
    workflowNote: "Each stage is a visible status. Moving a visit forward is recorded against the signed-in staff member.",
    columns: [{ key: "visit_number", label: "Visit" }, { key: "patient_name", label: "Patient" }, { key: "service", label: "Service", hideOnMobile: true }, { key: "payer", label: "Payer", hideOnMobile: true }, { key: "checked_in_at", label: "Checked in", format: "datetime", hideOnMobile: true }, { key: "status", label: "Stage", format: "status" }],
    fields: [pat, sel("service", "Service", ["OPD Consultation", "Specialist Consultation", "Dental Consultation", "Antenatal Visit", "Paediatric Review"]), sel("visit_type", "Visit type", ["walk_in", "appointment", "referral"]), sel("payer", "Payer", ["cash", "insurance", "mpesa"]), doc, note("complaint", "Presenting complaint")],
    filters: status("Stage", ["checked_in", "triaged", "in_consultation", "investigations", "billing", "discharged"]),
    actions: flow(["checked_in", "triaged", "in_consultation", "investigations", "billing", "discharged"], "Cancel visit"), seedCount: 30,
    seed: (i) => ({ visit_number: code("OPD-2609", i), ...patientAt(i), ...dentistAt(i), service: pick(["OPD Consultation", "Specialist Consultation", "Dental Consultation", "Paediatric Review"], i), visit_type: pick(["walk_in", "appointment"], i), payer: pick(["cash", "insurance", "mpesa"], i), checked_in_at: at(0, 8 + (i % 8), (i * 7) % 60), status: pick(["checked_in", "triaged", "in_consultation", "investigations", "billing", "discharged"], i) }),
  }),
  mod({
    key: "emergency", title: "Emergency", singular: "Emergency case", section: "Patient Care", icon: Siren, permission: P,
    description: "Emergency registration, triage priority and disposition. Triage levels are hospital-configured.",
    columns: [{ key: "case_number", label: "Case" }, { key: "patient_name", label: "Patient" }, { key: "triage_level", label: "Triage" }, { key: "arrived_at", label: "Arrived", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, sel("triage_level", "Triage level (hospital-configured)", ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]), sel("arrival_mode", "Arrival mode", ["walk_in", "ambulance", "referral", "police"]), doc, note("chief_complaint", "Chief complaint", true)],
    filters: status("Status", ["waiting", "in_treatment", "observation", "admitted", "referred", "discharged"]),
    actions: [
      { key: "treat", label: "Start treatment", to: "in_treatment", when: (r) => r["status"] === "waiting" },
      { key: "observe", label: "Move to observation", to: "observation", when: (r) => r["status"] === "in_treatment" },
      { key: "admit", label: "Admit", to: "admitted", when: (r) => ["in_treatment", "observation"].includes(String(r["status"])) },
      { key: "refer", label: "Refer out", to: "referred", fields: [t("referral_to", "Referred to", true)], when: (r) => ["in_treatment", "observation"].includes(String(r["status"])) },
      { key: "discharge", label: "Discharge", to: "discharged", confirm: "Discharge this emergency patient?", when: (r) => ["in_treatment", "observation"].includes(String(r["status"])) },
    ], seedCount: 12,
    seed: (i) => ({ case_number: code("ER-2609", i), ...patientAt(i + 40), ...dentistAt(i), triage_level: pick(["Level 2", "Level 3", "Level 3", "Level 4", "Level 1"], i), arrival_mode: pick(["walk_in", "ambulance", "referral"], i), chief_complaint: "Development case", arrived_at: at(0, 1 + i, 15), status: pick(["waiting", "in_treatment", "observation", "admitted", "discharged"], i) }),
  }),
  mod({
    key: "admissions", title: "Admissions", singular: "Admission", section: "Patient Care", icon: ClipboardPlus, permission: P,
    description: "Admission request → approval → ward/room/bed → attending clinician → discharge.",
    workflowNote: "Bed allocation and transfers must be transactional in Laravel. Here they are development data only.",
    columns: [{ key: "admission_number", label: "Admission" }, { key: "patient_name", label: "Patient" }, { key: "ward", label: "Ward", hideOnMobile: true }, { key: "bed", label: "Bed" }, { key: "admitted_at", label: "Admitted", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, sel("ward", "Ward", WARDS), t("bed", "Bed"), doc, sel("admission_source", "Source", ["opd", "emergency", "maternity", "theatre", "referral"]), note("reason", "Reason for admission", true)],
    filters: status("Status", ["requested", "approved", "admitted", "discharge_ordered", "discharged", "cancelled"]),
    actions: [
      ...flow(["requested", "approved", "admitted", "discharge_ordered"], "Cancel admission"),
      { key: "transfer", label: "Transfer ward", fields: [sel("ward", "New ward", WARDS), t("bed", "New bed", true)], when: (r) => r["status"] === "admitted", mockOnly: PENDING },
      { key: "discharge", label: "Complete discharge", to: "discharged", confirm: "Confirm billing clearance and discharge summary are complete?", when: (r) => r["status"] === "discharge_ordered" },
    ], seedCount: 18,
    seed: (i) => ({ admission_number: code("ADM-26", i), ...patientAt(i + 20), ...dentistAt(i), ward: pick(WARDS, i), bed: `${pick(["A", "B", "M", "P", "V"], i)}-${(i % 12) + 1}`, admission_source: pick(["opd", "emergency", "maternity"], i), reason: "Development admission", admitted_at: at(-(i % 6), 10), status: pick(["admitted", "admitted", "requested", "approved", "discharge_ordered", "discharged"], i) }),
  }),
  mod({
    key: "referrals", title: "Referrals", singular: "Referral", section: "Patient Care", icon: Share2, permission: P,
    description: "Inbound and outbound referrals.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "direction", label: "Direction" }, { key: "facility", label: "Facility", hideOnMobile: true }, { key: "created_at", label: "Date", format: "date", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, sel("direction", "Direction", ["inbound", "outbound"]), t("facility", "Facility", true), note("reason", "Reason", true)],
    actions: flow(["pending", "sent", "accepted", "completed"], "Cancel"), seedCount: 8,
    seed: (i) => ({ ...patientAt(i + 5), direction: pick(["outbound", "inbound"], i), facility: `Referral facility ${i + 1} (dev)`, reason: "Development referral", created_at: at(-i), status: pick(["pending", "sent", "accepted", "completed"], i) }),
  }),

  // ---------- Nursing & wards ----------
  mod({
    key: "wards", title: "Wards", singular: "Ward", section: "Nursing & Wards", icon: DoorOpen, permission: N,
    description: "Wards and their bed capacity.",
    columns: [{ key: "name", label: "Ward" }, { key: "type", label: "Type", hideOnMobile: true }, { key: "capacity", label: "Beds" }, { key: "occupied", label: "Occupied" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Name", true), sel("type", "Type", ["general", "maternity", "paediatric", "private", "icu"]), { name: "capacity", label: "Bed capacity", type: "number", required: true, min: 1 }, sel("status", "Status", ["active", "inactive"])],
    seedCount: WARDS.length, seed: (i) => ({ name: WARDS[i]!, type: pick(["general", "general", "maternity", "paediatric", "private"], i), capacity: 12, occupied: (i * 5 + 4) % 12, status: "active" }),
  }),
  mod({
    key: "beds", title: "Beds", singular: "Bed", section: "Nursing & Wards", icon: BedSingle, permission: N,
    description: "Bed board: available, occupied, reserved, cleaning, maintenance, blocked.",
    columns: [{ key: "bed", label: "Bed" }, { key: "ward", label: "Ward" }, { key: "patient_name", label: "Patient", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("bed", "Bed code", true), sel("ward", "Ward", WARDS), sel("status", "Status", ["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"])],
    filters: [{ key: "ward", label: "Ward", options: WARDS }, { key: "status", label: "Status", options: ["available", "occupied", "reserved", "cleaning", "maintenance", "blocked"] }],
    actions: [
      { key: "clean", label: "Send for cleaning", to: "cleaning", when: (r) => r["status"] === "available" },
      { key: "ready", label: "Mark available", to: "available", when: (r) => ["cleaning", "maintenance", "blocked", "reserved"].includes(String(r["status"])) },
      { key: "block", label: "Block bed", to: "blocked", danger: true, when: (r) => r["status"] === "available" },
    ], seedCount: 40,
    seed: (i) => { const s = pick(["occupied", "available", "occupied", "cleaning", "reserved", "occupied", "available", "maintenance"], i); return { bed: `${pick(["A", "B", "M", "P", "V"], i)}-${Math.floor(i / 5) + 1}`, ward: pick(WARDS, i), status: s, patient_name: s === "occupied" ? patientAt(i).patient_name : null }; },
  }),
  mod({
    key: "nursing-notes", title: "Nursing Notes", singular: "Nursing note", section: "Nursing & Wards", icon: HeartPulse, permission: N,
    description: "Assessments, care-plan notes and observations — timestamped and attributed to the signed-in nurse.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "note_type", label: "Type" }, { key: "shift", label: "Shift", hideOnMobile: true }, { key: "recorded_by", label: "By", hideOnMobile: true }, { key: "recorded_at", label: "Time", format: "datetime" }],
    fields: [pat, sel("note_type", "Type", ["assessment", "care_plan", "pain", "fall_risk", "pressure_sore", "fluid_balance", "observation", "discharge"]), sel("shift", "Shift", SHIFTS), note("note", "Note", true)],
    filters: [{ key: "shift", label: "Shift", options: SHIFTS }], canEdit: false, seedCount: 24,
    seed: (i) => ({ ...patientAt(i + 20), note_type: pick(["assessment", "observation", "pain", "fluid_balance"], i), shift: pick(SHIFTS, i), note: "Development nursing note.", recorded_by: `Nurse ${pick(["Wairimu", "Jepchirchir", "Akinyi"], i)} (dev)`, recorded_at: at(-(i % 3), 7 + (i % 12)) }),
  }),
  mod({
    key: "medication-admin", title: "Medication Rounds", singular: "Medication dose", section: "Nursing & Wards", icon: Syringe, permission: N,
    description: "Medication schedules and administration record (MAR).",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "medicine", label: "Medicine" }, { key: "dose", label: "Dose", hideOnMobile: true }, { key: "due_at", label: "Due", format: "datetime" }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, t("medicine", "Medicine", true), t("dose", "Dose & route", true), { name: "due_at", label: "Due at", type: "datetime", required: true }],
    filters: status("Status", ["due", "given", "withheld", "missed"]),
    actions: [
      { key: "give", label: "Record given", to: "given", confirm: "Confirm this dose was administered now?", when: (r) => r["status"] === "due" },
      { key: "withhold", label: "Withhold", to: "withheld", fields: [t("withhold_reason", "Reason", true)], when: (r) => r["status"] === "due" },
    ], canEdit: false, seedCount: 20,
    seed: (i) => ({ ...patientAt(i + 20), medicine: pick(["Paracetamol", "Amoxicillin", "Metronidazole", "Ceftriaxone", "Omeprazole"], i), dose: pick(["1 g PO", "500 mg PO", "1 g IV"], i), due_at: at(0, 6 + (i % 16)), status: pick(["due", "given", "given", "due", "withheld"], i) }),
  }),
  mod({
    key: "handovers", title: "Shift Handover", singular: "Handover", section: "Nursing & Wards", icon: ArrowRightLeft, permission: N,
    description: "Ward and shift handover notes.",
    columns: [{ key: "ward", label: "Ward" }, { key: "shift", label: "Shift" }, { key: "handed_by", label: "From", hideOnMobile: true }, { key: "received_by", label: "To", hideOnMobile: true }, { key: "created_at", label: "Time", format: "datetime" }],
    fields: [sel("ward", "Ward", WARDS), sel("shift", "Shift", SHIFTS), t("received_by", "Received by", true), note("summary", "Summary", true)],
    canEdit: false, seedCount: 9,
    seed: (i) => ({ ward: pick(WARDS, i), shift: pick(SHIFTS, i), handed_by: "Nurse Wairimu (dev)", received_by: "Nurse Akinyi (dev)", summary: "Development handover.", created_at: at(-Math.floor(i / 3), 7 + (i % 3) * 8) }),
  }),

  // ---------- Departments ----------
  mod({
    key: "maternity", title: "Maternity", singular: "Pregnancy record", section: "Departments", icon: Baby, permission: P,
    description: "Antenatal, delivery and postnatal records. Clinical fields are hospital-configured.",
    columns: [{ key: "patient_name", label: "Mother" }, { key: "edd", label: "EDD", format: "date" }, { key: "gestation_weeks", label: "Weeks", hideOnMobile: true }, { key: "status", label: "Stage", format: "status" }],
    fields: [pat, { name: "edd", label: "Expected delivery date", type: "date" }, { name: "gestation_weeks", label: "Gestation (weeks)", type: "number", min: 0 }, note("notes", "Notes")],
    filters: status("Stage", ["antenatal", "in_labour", "delivered", "postnatal", "discharged"]),
    actions: flow(["antenatal", "in_labour", "delivered", "postnatal", "discharged"]), seedCount: 10,
    seed: (i) => ({ ...patientAt(i + 60), edd: day(20 + i * 9), gestation_weeks: 24 + (i % 16), notes: null, status: pick(["antenatal", "antenatal", "in_labour", "delivered", "postnatal"], i) }),
  }),
  mod({
    key: "growth", title: "Paediatric Growth", singular: "Growth measurement", section: "Departments", icon: Ruler, permission: P,
    description: "Paediatric weight, height and head circumference.",
    columns: [{ key: "patient_name", label: "Child" }, { key: "weight_kg", label: "Weight (kg)" }, { key: "height_cm", label: "Height (cm)" }, { key: "head_cm", label: "Head (cm)", hideOnMobile: true }, { key: "measured_on", label: "Date", format: "date" }],
    fields: [pat, { name: "weight_kg", label: "Weight (kg)", type: "number", required: true, min: 0 }, { name: "height_cm", label: "Height (cm)", type: "number", required: true, min: 0 }, { name: "head_cm", label: "Head circumference (cm)", type: "number", min: 0 }, { name: "measured_on", label: "Date", type: "date", required: true }],
    seedCount: 10, seed: (i) => ({ ...patientAt(i + 80), weight_kg: 8 + i, height_cm: 70 + i * 4, head_cm: 44 + (i % 5), measured_on: day(-i * 10) }),
  }),
  mod({
    key: "theatre", title: "Theatre", singular: "Procedure booking", section: "Departments", icon: Scissors, permission: "view_theatre",
    description: "Procedure scheduling, pre-op checklist, surgery, recovery.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "procedure", label: "Procedure" }, { key: "room", label: "Room", hideOnMobile: true }, { key: "scheduled_at", label: "Scheduled", format: "datetime" }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, t("procedure", "Procedure", true), sel("room", "Operating room", ["Theatre 1", "Theatre 2", "Minor theatre"]), { name: "scheduled_at", label: "Scheduled for", type: "datetime", required: true }, doc, t("anaesthetist", "Anaesthetist"), { name: "preop_checklist", label: "Pre-op checklist complete", type: "checkbox" }, note("notes", "Notes")],
    filters: status("Status", ["scheduled", "pre_op", "in_theatre", "recovery", "completed", "cancelled"]),
    actions: flow(["scheduled", "pre_op", "in_theatre", "recovery", "completed"], "Cancel procedure"), seedCount: 8,
    seed: (i) => ({ ...patientAt(i + 30), ...dentistAt(i), procedure: pick(["Appendicectomy", "Caesarean section", "Hernia repair", "Wisdom tooth surgery"], i), room: pick(["Theatre 1", "Theatre 2", "Minor theatre"], i), scheduled_at: at(i % 4, 9 + (i % 4) * 2), anaesthetist: "Dr. Kilonzo (dev)", preop_checklist: i % 2 === 0, status: pick(["scheduled", "pre_op", "in_theatre", "recovery", "completed"], i) }),
  }),

  // ---------- Pharmacy / diagnostics ----------
  mod({
    key: "dispensing", title: "Dispensing", singular: "Dispensing task", section: "Pharmacy", icon: Pill, permission: RX,
    description: "Pharmacy queue: verify → dispense → payment. Stock deduction must be done by Laravel.",
    columns: [{ key: "rx_number", label: "Rx" }, { key: "patient_name", label: "Patient" }, { key: "items", label: "Items", hideOnMobile: true }, { key: "payer", label: "Payer", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, note("items", "Items", true), sel("payer", "Payer", ["cash", "insurance", "mpesa"])],
    filters: status("Status", ["queued", "verified", "dispensed", "returned"]),
    actions: [
      { key: "verify", label: "Pharmacist verify", to: "verified", when: (r) => r["status"] === "queued" },
      { key: "dispense", label: "Dispense", to: "dispensed", confirm: "Dispense these items? Live stock deduction requires the Laravel API.", when: (r) => r["status"] === "verified" },
      { key: "return", label: "Record return", to: "returned", danger: true, fields: [t("return_reason", "Reason", true)], when: (r) => r["status"] === "dispensed" },
    ], canEdit: false, seedCount: 16,
    seed: (i) => ({ rx_number: code("RX-26", i), ...patientAt(i + 10), items: pick(["Amoxicillin 500 mg × 15", "Paracetamol 1 g × 10", "Ibuprofen 400 mg × 10", "ORS × 4"], i), payer: pick(["cash", "insurance", "mpesa"], i), status: pick(["queued", "verified", "dispensed", "queued"], i) }),
  }),
  mod({
    key: "lab-tests", title: "Lab Test Catalogue", singular: "Test", section: "Diagnostics", icon: Microscope, permission: "view_lab_orders",
    description: "Configurable laboratory tests, sample types and turnaround.",
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Test" }, { key: "sample", label: "Sample", hideOnMobile: true }, { key: "price", label: "Price", format: "money" }],
    fields: [t("name", "Name", true), t("code", "Code", true), sel("sample", "Sample", ["blood", "urine", "stool", "swab", "other"]), { name: "price", label: "Price (KSh)", type: "money", min: 0 }, t("turnaround", "Turnaround")],
    canDelete: true, seedCount: 8,
    seed: (i) => ({ name: pick(["Full haemogram", "Malaria test", "Urinalysis", "Blood sugar", "Liver function", "Renal function", "Stool analysis", "Pregnancy test"], i), code: code("LT", i), sample: pick(["blood", "blood", "urine", "blood", "blood", "blood", "stool", "urine"], i), price: money(i, 300, 150), turnaround: "Same day" }),
  }),

  // ---------- Insurance ----------
  mod({
    key: "insurers", title: "Insurance Providers", singular: "Insurer", section: "Insurance", icon: ShieldPlus, permission: FIN,
    description: "Configurable insurers, schemes and co-pay rules. No provider is hardcoded.",
    columns: [{ key: "name", label: "Insurer" }, { key: "scheme", label: "Scheme", hideOnMobile: true }, { key: "copay_percent", label: "Co-pay %" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Name", true), t("scheme", "Scheme"), { name: "copay_percent", label: "Co-pay %", type: "number", min: 0 }, t("claims_email", "Claims contact"), sel("status", "Status", ["active", "inactive"])],
    canDelete: true, seedCount: 5,
    seed: (i) => ({ name: `Insurer ${String.fromCharCode(65 + i)} (dev)`, scheme: pick(["Corporate", "Individual", "Public"], i), copay_percent: pick([0, 10, 20], i), status: "active" }),
  }),
  mod({
    key: "preauths", title: "Pre-authorisations", singular: "Pre-authorisation", section: "Insurance", icon: FileBadge, permission: FIN,
    description: "Pre-authorisation requests to insurers.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "insurer", label: "Insurer" }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, t("insurer", "Insurer", true), t("member_number", "Member number", true), { name: "amount", label: "Amount (KSh)", type: "money", required: true, min: 1 }, note("reason", "Procedure / reason", true)],
    filters: status("Status", ["pending", "approved", "declined"]),
    actions: [{ key: "approve", label: "Record approval", to: "approved", fields: [t("approval_code", "Approval code", true)], when: (r) => r["status"] === "pending" }, { key: "decline", label: "Record decline", to: "declined", danger: true, when: (r) => r["status"] === "pending" }],
    seedCount: 8, seed: (i) => ({ ...patientAt(i + 3), insurer: `Insurer ${String.fromCharCode(65 + (i % 5))} (dev)`, member_number: code("MBR", i, 6), amount: money(i, 5000, 1500), reason: "Development pre-auth", status: pick(["pending", "approved", "declined"], i) }),
  }),
  mod({
    key: "claims", title: "Claims", singular: "Claim", section: "Insurance", icon: FileCheck2, permission: FIN,
    description: "Claim submission, tracking, rejection and resubmission.",
    columns: [{ key: "claim_number", label: "Claim" }, { key: "patient_name", label: "Patient" }, { key: "insurer", label: "Insurer", hideOnMobile: true }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [pat, t("insurer", "Insurer", true), t("invoice_number", "Invoice number", true), { name: "amount", label: "Claim amount (KSh)", type: "money", required: true, min: 1 }],
    filters: status("Status", ["draft", "submitted", "approved", "rejected", "paid"]),
    actions: [
      { key: "submit", label: "Submit", to: "submitted", when: (r) => r["status"] === "draft" },
      { key: "approve", label: "Record approved", to: "approved", when: (r) => r["status"] === "submitted" },
      { key: "reject", label: "Record rejection", to: "rejected", danger: true, fields: [t("rejection_reason", "Reason", true)], when: (r) => r["status"] === "submitted" },
      { key: "resubmit", label: "Resubmit", to: "submitted", when: (r) => r["status"] === "rejected" },
      { key: "paid", label: "Record payment", to: "paid", when: (r) => r["status"] === "approved" },
    ], seedCount: 14,
    seed: (i) => ({ claim_number: code("CLM-26", i), ...patientAt(i + 8), insurer: `Insurer ${String.fromCharCode(65 + (i % 5))} (dev)`, invoice_number: code("INV-2026", i), amount: money(i, 3000, 900), status: pick(["draft", "submitted", "approved", "rejected", "paid"], i) }),
  }),

  // ---------- HR & payroll ----------
  mod({
    key: "employees", title: "Employees", singular: "Employee", section: "Human Resources", icon: UserSquare2, permission: HR,
    description: "Staff records, departments, positions and contracts.",
    columns: [{ key: "staff_number", label: "Staff no." }, { key: "name", label: "Name" }, { key: "department", label: "Department", hideOnMobile: true }, { key: "position", label: "Position", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Full name", true), sel("department", "Department", DEPTS), t("position", "Position", true), { name: "phone", label: "Phone", type: "tel" }, { name: "email", label: "Email", type: "email" }, sel("contract_type", "Contract", ["permanent", "contract", "locum", "intern"]), { name: "start_date", label: "Start date", type: "date" }, sel("status", "Status", ["active", "on_leave", "exited"])],
    filters: [{ key: "department", label: "Department", options: DEPTS }], seedCount: 24,
    seed: (i) => ({ staff_number: code("MNH", i), name: `${pick(["Jane", "Peter", "Mercy", "Brian", "Faith", "Kevin"], i)} ${pick(["Kariuki", "Ochieng", "Kiptoo", "Mwende"], i)} (dev)`, department: pick(DEPTS, i), position: pick(["Nurse", "Clinical Officer", "Doctor", "Pharmacist", "Lab Technologist", "Accountant"], i), contract_type: pick(["permanent", "contract"], i), start_date: day(-400 - i * 30), status: pick(["active", "active", "active", "on_leave"], i) }),
  }),
  mod({
    key: "attendance", title: "Attendance & Shifts", singular: "Attendance record", section: "Human Resources", icon: CalendarCheck, permission: HR,
    description: "Clock-in/out and rostered shifts.",
    columns: [{ key: "employee", label: "Employee" }, { key: "shift", label: "Shift" }, { key: "date", label: "Date", format: "date" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("employee", "Employee", true), sel("shift", "Shift", SHIFTS), { name: "date", label: "Date", type: "date", required: true }, sel("status", "Status", ["present", "late", "absent"])],
    seedCount: 20, seed: (i) => ({ employee: `Staff ${i + 1} (dev)`, shift: pick(SHIFTS, i), date: day(-(i % 5)), status: pick(["present", "present", "late", "present", "absent"], i) }),
  }),
  mod({
    key: "leave", title: "Leave", singular: "Leave request", section: "Human Resources", icon: CalendarOff, permission: HR,
    description: "Leave requests and approvals.",
    columns: [{ key: "employee", label: "Employee" }, { key: "leave_type", label: "Type" }, { key: "from", label: "From", format: "date", hideOnMobile: true }, { key: "to", label: "To", format: "date", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("employee", "Employee", true), sel("leave_type", "Type", ["annual", "sick", "maternity", "paternity", "compassionate", "study"]), { name: "from", label: "From", type: "date", required: true }, { name: "to", label: "To", type: "date", required: true }, note("reason", "Reason")],
    validate: (v) => (v["from"] && v["to"] && String(v["to"]) < String(v["from"]) ? { to: "End date must be after start date" } : {}),
    actions: [{ key: "approve", label: "Approve", to: "approved", when: (r) => r["status"] === "pending" }, { key: "reject", label: "Reject", to: "rejected", danger: true, when: (r) => r["status"] === "pending" }],
    seedCount: 10, seed: (i) => ({ employee: `Staff ${i + 1} (dev)`, leave_type: pick(["annual", "sick", "annual", "study"], i), from: day(i * 3), to: day(i * 3 + 4), status: pick(["pending", "approved", "rejected"], i) }),
  }),
  mod({
    key: "payroll", title: "Payroll", singular: "Payroll period", section: "Human Resources", icon: Wallet, permission: "view_accounting",
    description: "Payroll periods and approval. Calculations and statutory rates must come from Laravel — none are computed here.",
    workflowNote: "Figures are development placeholders. Authoritative payroll calculation is server-side only.",
    columns: [{ key: "period", label: "Period" }, { key: "employees", label: "Staff" }, { key: "gross_total", label: "Gross (dev)", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("period", "Period (e.g. 2026-10)", true), note("notes", "Notes")],
    actions: [
      { key: "run", label: "Request payroll run", to: "calculated", when: (r) => r["status"] === "draft", mockOnly: "Payroll calculation must run in Laravel — development data only." },
      { key: "approve", label: "Approve", to: "approved", confirm: "Approve this payroll period?", when: (r) => r["status"] === "calculated" },
    ], canEdit: false, seedCount: 4,
    seed: (i) => ({ period: `2026-${String(9 - i).padStart(2, "0")}`, employees: 24, gross_total: 1800000 + i * 25000, status: pick(["draft", "approved", "approved", "approved"], i) }),
  }),
  mod({
    key: "recruitment", title: "Recruitment", singular: "Vacancy", section: "Human Resources", icon: Briefcase, permission: HR,
    description: "Job vacancies and applicants.",
    columns: [{ key: "title", label: "Vacancy" }, { key: "department", label: "Department", hideOnMobile: true }, { key: "applicants", label: "Applicants" }, { key: "closing_date", label: "Closes", format: "date" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("title", "Title", true), sel("department", "Department", DEPTS), { name: "closing_date", label: "Closing date", type: "date", required: true }, note("description", "Description", true)],
    actions: flow(["draft", "open", "interviewing", "filled"], "Cancel vacancy"), seedCount: 5,
    seed: (i) => ({ title: pick(["Registered Nurse", "Clinical Officer", "Pharmacist", "Lab Technologist", "Accountant"], i), department: pick(["Inpatient", "OPD", "Pharmacy", "Laboratory", "Finance"], i), applicants: i * 4, closing_date: day(10 + i * 5), status: pick(["open", "interviewing", "draft", "open", "filled"], i) }),
  }),

  // ---------- Procurement & tenders ----------
  mod({
    key: "purchase-requests", title: "Purchase Requests", singular: "Purchase request", section: "Procurement", icon: FileQuestion, permission: PROC,
    description: "Departmental requests → approval → sourcing.",
    columns: [{ key: "pr_number", label: "PR" }, { key: "department", label: "Department" }, { key: "items", label: "Items", hideOnMobile: true }, { key: "estimated_total", label: "Estimate", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [sel("department", "Department", DEPTS), note("items", "Items", true), { name: "estimated_total", label: "Estimated total (KSh)", type: "money", required: true, min: 1 }, sel("priority", "Priority", ["normal", "urgent"])],
    actions: flow(["submitted", "approved", "sourcing", "ordered"], "Reject"), seedCount: 10,
    seed: (i) => ({ pr_number: code("PR-26", i), department: pick(DEPTS, i), items: "Development items", estimated_total: money(i, 20000, 5000), priority: pick(["normal", "urgent"], i), status: pick(["submitted", "approved", "sourcing", "ordered"], i) }),
  }),
  mod({
    key: "quotations", title: "Quotations / RFQs", singular: "Quotation", section: "Procurement", icon: ListChecks, permission: PROC,
    description: "Supplier quotations and comparison.",
    columns: [{ key: "rfq", label: "RFQ" }, { key: "supplier", label: "Supplier" }, { key: "amount", label: "Amount", format: "money" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("rfq", "RFQ reference", true), t("supplier", "Supplier", true), { name: "amount", label: "Quoted amount (KSh)", type: "money", required: true, min: 1 }, { name: "valid_until", label: "Valid until", type: "date" }],
    actions: [{ key: "select", label: "Select quotation", to: "selected", when: (r) => r["status"] === "received" }, { key: "reject", label: "Reject", to: "rejected", danger: true, when: (r) => r["status"] === "received" }],
    seedCount: 9, seed: (i) => ({ rfq: code("RFQ-26", Math.floor(i / 3)), supplier: `Supplier ${i + 1} (dev)`, amount: money(i, 18000, 2000), valid_until: day(30), status: pick(["received", "received", "selected"], i) }),
  }),
  mod({
    key: "grn", title: "Goods Received", singular: "Goods received note", section: "Procurement", icon: PackageCheck, permission: PROC,
    description: "GRNs against purchase orders.",
    columns: [{ key: "grn_number", label: "GRN" }, { key: "po_number", label: "PO" }, { key: "supplier", label: "Supplier", hideOnMobile: true }, { key: "received_on", label: "Received", format: "date" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("po_number", "PO number", true), t("supplier", "Supplier", true), { name: "received_on", label: "Received on", type: "date", required: true }, note("items", "Items received", true)],
    actions: [{ key: "accept", label: "Accept into stock", to: "accepted", confirm: "Accept goods? Live stock update requires Laravel.", when: (r) => r["status"] === "inspecting" }],
    seedCount: 6, seed: (i) => ({ grn_number: code("GRN-26", i), po_number: code("PO-2026", i), supplier: `Supplier ${i + 1} (dev)`, received_on: day(-i * 2), items: "Development items", status: pick(["inspecting", "accepted"], i) }),
  }),
  mod({
    key: "tenders", title: "Public Tenders", singular: "Tender", section: "Procurement", icon: Gavel, permission: PROC,
    description: "Create, publish, close, evaluate and award tenders. Only published fields appear on the public /tenders page.",
    columns: [{ key: "reference", label: "Reference" }, { key: "title", label: "Title" }, { key: "category", label: "Category", hideOnMobile: true }, { key: "closing_date", label: "Closes", format: "date" }, { key: "status", label: "Status", format: "status" }],
    fields: [t("title", "Title", true), t("reference", "Reference number", true), sel("department", "Department", DEPTS), t("category", "Category", true), note("description", "Description", true), note("eligibility", "Eligibility"), note("submission", "Submission instructions"), { name: "opening_date", label: "Opening date", type: "date", required: true }, { name: "closing_date", label: "Closing date", type: "date", required: true }, t("contact", "Contact")],
    validate: (v) => (v["opening_date"] && v["closing_date"] && String(v["closing_date"]) < String(v["opening_date"]) ? { closing_date: "Closing date must be after opening date" } : {}),
    filters: status("Status", ["draft", "published", "open", "closed", "under_evaluation", "awarded", "cancelled"]),
    actions: [...flow(["draft", "published", "open", "closed", "under_evaluation"], "Cancel tender"), { key: "award", label: "Award", to: "awarded", fields: [t("awarded_to", "Awarded to", true)], confirm: "Award this tender?", when: (r) => r["status"] === "under_evaluation" }],
    canEdit: (r) => r["status"] === "draft", seedCount: 6,
    seed: (i) => ({ reference: `MNH/T/${2026}/${String(i + 1).padStart(3, "0")}`, title: pick(["Supply of medical consumables", "Supply of laboratory reagents", "Cleaning services", "Catering services", "Supply of pharmaceuticals", "Maintenance of theatre equipment"], i), department: pick(["Procurement", "Laboratory", "Administration", "Nutrition", "Pharmacy", "Theatre"], i), category: pick(["Goods", "Services"], i), description: "Development tender — not a real procurement notice.", eligibility: "As stated in tender document.", submission: "As stated in tender document.", opening_date: day(-10 + i), closing_date: day(14 + i * 3), contact: "procurement@munab.example", status: pick(["open", "open", "published", "closed", "under_evaluation", "draft"], i) }),
  }),

  // ---------- SMS ----------
  mod({
    key: "sms-templates", title: "SMS Templates", singular: "SMS template", section: "Communication", icon: MessageSquareText, permission: "manage_marketing",
    description: "Reusable message templates with placeholders.",
    columns: [{ key: "name", label: "Template" }, { key: "use_case", label: "Use case", hideOnMobile: true }, { key: "body", label: "Message" }],
    fields: [t("name", "Name", true), sel("use_case", "Use case", ["appointment_reminder", "follow_up", "payment_reminder", "lab_result", "admission", "discharge", "marketing", "emergency"]), { name: "body", label: "Message", type: "textarea", required: true, wide: true, help: "Placeholders like {name}, {date} are filled by Laravel." }],
    canDelete: true, seedCount: 5,
    seed: (i) => ({ name: pick(["Appointment reminder", "Payment reminder", "Lab results ready", "Discharge follow-up", "Clinic announcement"], i), use_case: pick(["appointment_reminder", "payment_reminder", "lab_result", "discharge", "marketing"], i), body: "Dear {name}, … — Munab Nursing Home" }),
  }),
  mod({
    key: "sms", title: "Bulk SMS", singular: "SMS campaign", section: "Communication", icon: Send, permission: "manage_marketing",
    description: "Queue bulk or scheduled SMS. Sending happens in Laravel's queue — never from the browser.",
    columns: [{ key: "name", label: "Campaign" }, { key: "segment", label: "Audience", hideOnMobile: true }, { key: "recipients", label: "Recipients" }, { key: "scheduled_at", label: "Scheduled", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [t("name", "Name", true), sel("segment", "Audience", ["all_consented_patients", "appointments_tomorrow", "outstanding_balance", "staff"]), t("template", "Template", true), { name: "scheduled_at", label: "Send at", type: "datetime" }],
    actions: [{ key: "queue", label: "Queue for sending", to: "queued", confirm: "Queue this SMS? Only patients who consented will receive marketing messages.", when: (r) => r["status"] === "draft", mockOnly: "No SMS API yet — nothing is sent." }],
    seedCount: 5, seed: (i) => ({ name: `SMS batch ${i + 1} (dev)`, segment: pick(["appointments_tomorrow", "outstanding_balance", "all_consented_patients"], i), template: "Appointment reminder", recipients: 20 + i * 11, scheduled_at: at(i, 8), status: pick(["draft", "queued", "delivered", "failed"], i) }),
  }),
  mod({
    key: "sms-log", title: "SMS Delivery Log", singular: "Message", section: "Communication", icon: MessagesSquare, permission: "manage_marketing",
    description: "Per-message delivery status.",
    columns: [{ key: "to", label: "To" }, { key: "body", label: "Message", hideOnMobile: true }, { key: "sent_at", label: "Sent", format: "datetime" }, { key: "status", label: "Status", format: "status" }],
    fields: [], canCreate: false, canEdit: false, seedCount: 15,
    seed: (i) => ({ to: `07•• ••• ${String(100 + i).slice(-3)}`, body: "Development message", sent_at: at(-(i % 4), 9 + (i % 8)), status: pick(["delivered", "delivered", "failed", "pending"], i) }),
  }),
  mod({
    key: "bed-board", title: "Inpatients", singular: "Inpatient", section: "Nursing & Wards", icon: BedDouble, permission: N,
    description: "Current inpatients by ward with attending clinician and assigned nurse.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "ward", label: "Ward" }, { key: "bed", label: "Bed" }, { key: "nurse", label: "Nurse", hideOnMobile: true }, { key: "status", label: "Condition", format: "status" }],
    fields: [pat, sel("ward", "Ward", WARDS), t("bed", "Bed", true), t("nurse", "Assigned nurse")],
    actions: [{ key: "discharge", label: "Order discharge", to: "discharge_ordered", when: (r) => r["status"] !== "discharge_ordered" }],
    seedCount: 14, seed: (i) => ({ ...patientAt(i + 20), ward: pick(WARDS, i), bed: `${pick(["A", "B", "M", "P", "V"], i)}-${(i % 12) + 1}`, nurse: `Nurse ${pick(["Wairimu", "Akinyi", "Jepchirchir"], i)} (dev)`, status: pick(["stable", "stable", "under_observation", "discharge_ordered"], i) }),
  }),
];
void Discharge;
