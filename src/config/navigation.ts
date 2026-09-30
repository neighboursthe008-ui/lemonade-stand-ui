import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, CalendarDays, ListOrdered, Stethoscope, Receipt, Package, Bell, Megaphone, Shield, Activity } from "lucide-react";

export interface NavItem { label: string; to: string; permission?: string | string[]; superAdminOnly?: boolean; ready?: boolean }
export interface NavGroup { label: string; icon: LucideIcon; items: NavItem[] }

/** Items with ready=false are rendered disabled ("coming in a later phase") — never as dead links. */
export const staffNav: NavGroup[] = [
  { label: "Overview", icon: LayoutDashboard, items: [{ label: "Dashboard", to: "/app/dashboard", ready: true }] },
  { label: "Patients", icon: Users, items: [{ label: "Patients", to: "/app/patients", permission: "view_patients" }] },
  { label: "Appointments", icon: CalendarDays, items: [{ label: "Appointments", to: "/app/appointments", permission: "view_appointments" }] },
  { label: "Waiting list", icon: ListOrdered, items: [{ label: "Queue", to: "/app/queue", permission: "view_queue" }] },
  { label: "Clinical", icon: Stethoscope, items: [
    { label: "Consultations", to: "/app/consultations", permission: "view_consultations" },
    { label: "Dental chart", to: "/app/dental-chart", permission: "view_dental_chart" },
    { label: "Prescriptions", to: "/app/prescriptions", permission: "view_prescriptions" },
    { label: "Laboratory", to: "/app/lab", permission: "view_lab_orders" },
    { label: "Radiology", to: "/app/radiology", permission: "view_radiology_orders" },
  ] },
  { label: "Billing", icon: Receipt, items: [
    { label: "Invoices", to: "/app/invoices", permission: "view_invoices" },
    { label: "Payments", to: "/app/payments", permission: "view_payments" },
    { label: "Reports", to: "/app/reports", permission: ["view_reports", "view_accounting"] },
  ] },
  { label: "Inventory", icon: Package, items: [
    { label: "Products", to: "/app/inventory", permission: "view_inventory" },
    { label: "Orders", to: "/app/orders", permission: "view_inventory" },
  ] },
  { label: "Notifications", icon: Bell, items: [{ label: "Notifications", to: "/app/notifications", permission: "view_notifications" }] },
  { label: "Marketing", icon: Megaphone, items: [{ label: "Campaigns", to: "/admin/campaigns", permission: "manage_marketing" }] },
  { label: "Administration", icon: Shield, items: [
    { label: "Users", to: "/admin/users", permission: "view_users" },
    { label: "Settings", to: "/admin/settings", superAdminOnly: true },
    { label: "Integrations", to: "/admin/integrations", superAdminOnly: true },
    { label: "Backups", to: "/admin/backups", superAdminOnly: true },
  ] },
  { label: "Developer", icon: Activity, items: [{ label: "Integration status", to: "/dev/integration-status", ready: true }] },
];
