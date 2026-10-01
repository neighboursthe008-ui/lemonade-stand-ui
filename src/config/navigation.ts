import type { LucideIcon } from "lucide-react";
import { Home, Search, User, BarChart3, Bot, Plug } from "lucide-react";
import { modules } from "@/modules/registry";

export interface NavItem { label: string; to: string; icon: LucideIcon; permission?: string | string[]; superAdminOnly?: boolean; ready?: boolean; badge?: number }
export interface NavGroup { label: string; items: NavItem[] }

const SECTIONS = ["Main", "Patient Care", "Clinical", "Dental", "Nursing & Wards", "Departments", "Diagnostics", "Pharmacy", "Finance", "Insurance", "Accounting", "Inventory", "Procurement", "Human Resources", "Communication", "Content & Marketing", "Administration", "System"];

/** Built from the module registry so every menu item has a working page. Payroll lives in Human Resources (calculations are server-side only). */
const extra: Record<string, NavItem[]> = {
  Main: [
    { label: "Dashboard", to: "/app/dashboard", icon: Home, ready: true },
    { label: "Global Search", to: "/app/search", icon: Search, ready: true },
  ],
  Clinical: [{ label: "Patients", to: "/app/patients", icon: User, permission: "view_patients", ready: true }],
  Accounting: [{ label: "Reports", to: "/app/reports", icon: BarChart3, permission: ["view_reports", "view_accounting"], ready: true }],
  Communication: [{ label: "AI Assistant", to: "/app/assistant", icon: Bot, ready: true }],
  System: [],
};

export const staffNav: NavGroup[] = SECTIONS.map((label) => ({
  label,
  items: [
    ...(extra[label] ?? []),
    ...modules.filter((m) => m.section === label).map((m): NavItem => ({
      label: m.title, to: `/app/${m.key}`, icon: m.icon, ready: true,
      ...(m.permission ? { permission: m.permission } : {}), ...(m.superAdminOnly ? { superAdminOnly: true } : {}),
    })),
    ...(label === "System" ? [{ label: "Integration Status", to: "/dev/integration-status", icon: Plug, ready: true }] : []),
  ],
}));
