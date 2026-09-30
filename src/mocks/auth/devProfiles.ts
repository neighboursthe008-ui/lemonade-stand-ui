import type { CurrentUser } from "@/types/auth";

/** MOCK development profiles — ids are negative so they never collide with production ids. */
const branches = [
  { id: -1, name: "Lemonade — Westlands (dev)", is_primary: true },
  { id: -2, name: "Lemonade — Kilimani (dev)", is_primary: false },
];
const base = { phone: null, organization_id: -1, branch_id: -1, branches, must_change_password: false, pin_verified_at: null };

const clinical = ["view_patients", "view_appointments", "view_queue", "view_consultations", "view_dental_chart", "view_prescriptions", "view_lab_orders", "view_radiology_orders", "view_notifications"];
const all = [...clinical, "create_patients", "edit_patients", "create_appointments", "collect_vitals", "create_prescriptions", "prescribe_medication", "edit_dental_chart", "update_lab_results", "view_invoices", "create_invoices", "view_payments", "create_payments", "view_inventory", "view_reports", "view_accounting", "view_users", "create_users", "edit_users", "manage_marketing", "manage_settings"];

export const devProfiles: CurrentUser[] = [
  { ...base, id: -100, name: "Super Admin (dev)", email: "superadmin@dev.local", roles: ["super_admin"], permissions: all, is_super_admin: true },
  { ...base, id: -101, name: "Dr. Achieng Otieno (dev)", email: "dentist@dev.local", roles: ["dentist"], permissions: [...clinical, "collect_vitals", "create_prescriptions", "prescribe_medication", "edit_dental_chart"], is_super_admin: false },
  { ...base, id: -102, name: "Grace Mwangi (dev)", email: "reception@dev.local", roles: ["receptionist"], permissions: ["view_patients", "create_patients", "edit_patients", "view_appointments", "create_appointments", "view_queue", "view_notifications"], is_super_admin: false },
  { ...base, id: -103, name: "Peter Kamau (dev)", email: "cashier@dev.local", roles: ["cashier"], permissions: ["view_patients", "view_invoices", "create_invoices", "view_payments", "create_payments", "view_notifications"], is_super_admin: false },
  { ...base, id: -104, name: "Mary Njeri (dev)", email: "inventory@dev.local", roles: ["inventory_manager"], permissions: ["view_inventory", "view_reports", "view_notifications"], is_super_admin: false },
];
