import type { LucideIcon } from "lucide-react";
import {
  Home, Search, User, CalendarDays, Clock, Stethoscope, Smile, ClipboardList, Pill, FlaskConical, ScanLine,
  FileText, CreditCard, LineChart, Boxes, Package, Truck, ShoppingCart, Store, ShoppingBag, LayoutTemplate, Star,
  Newspaper, Image, CalendarRange, Megaphone, BarChart3, Bell, Bot, Users, ShieldCheck, GitBranch, Settings,
  DatabaseBackup, Activity, ScrollText, Plug,
} from "lucide-react";

export interface NavItem { label: string; to: string; icon: LucideIcon; permission?: string | string[]; superAdminOnly?: boolean; ready?: boolean; badge?: number }
export interface NavGroup { label: string; items: NavItem[] }

/** Items with ready=false are rendered disabled ("coming in a later phase") — never as dead links.
 *  Payroll is intentionally excluded (out of scope). */
export const staffNav: NavGroup[] = [
  { label: "Main", items: [
    { label: "Dashboard", to: "/app/dashboard", icon: Home, ready: true },
    { label: "Global Search", to: "/app/search", icon: Search },
  ] },
  { label: "Clinical", items: [
    { label: "Patients", to: "/app/patients", icon: User, permission: "view_patients" },
    { label: "Appointments", to: "/app/appointments", icon: CalendarDays, permission: "view_appointments" },
    { label: "Waiting List", to: "/app/queue", icon: Clock, permission: "view_queue" },
    { label: "Consultations", to: "/app/consultations", icon: Stethoscope, permission: "view_consultations" },
    { label: "Dental Chart", to: "/app/dental-chart", icon: Smile, permission: "view_dental_chart" },
    { label: "Treatment Plans", to: "/app/treatment-plans", icon: ClipboardList, permission: "view_consultations" },
    { label: "Prescriptions", to: "/app/prescriptions", icon: Pill, permission: "view_prescriptions" },
    { label: "Laboratory", to: "/app/lab", icon: FlaskConical, permission: "view_lab_orders" },
    { label: "Radiology", to: "/app/radiology", icon: ScanLine, permission: "view_radiology_orders" },
  ] },
  { label: "Finance", items: [
    { label: "Billing", to: "/app/invoices", icon: FileText, permission: "view_invoices" },
    { label: "Payments", to: "/app/payments", icon: CreditCard, permission: "view_payments" },
    { label: "Accounting", to: "/app/reports", icon: LineChart, permission: ["view_reports", "view_accounting"] },
  ] },
  { label: "Inventory & Shop", items: [
    { label: "Inventory", to: "/app/inventory", icon: Boxes, permission: "view_inventory" },
    { label: "Products", to: "/app/products", icon: Package, permission: "view_inventory" },
    { label: "Suppliers", to: "/app/suppliers", icon: Truck, permission: "view_inventory" },
    { label: "Purchasing", to: "/app/purchasing", icon: ShoppingCart, permission: "view_inventory" },
    { label: "Shop", to: "/app/shop", icon: Store, permission: "view_inventory" },
    { label: "Orders", to: "/app/orders", icon: ShoppingBag, permission: "view_inventory" },
  ] },
  { label: "Content & Marketing", items: [
    { label: "CMS", to: "/admin/cms", icon: LayoutTemplate, permission: "manage_marketing" },
    { label: "Testimonials", to: "/admin/testimonials", icon: Star, permission: "manage_marketing" },
    { label: "Blog", to: "/admin/blog", icon: Newspaper, permission: "manage_marketing" },
    { label: "Gallery", to: "/admin/gallery", icon: Image, permission: "manage_marketing" },
    { label: "News & Events", to: "/admin/news", icon: CalendarRange, permission: "manage_marketing" },
    { label: "Campaigns", to: "/admin/campaigns", icon: Megaphone, permission: "manage_marketing" },
    { label: "SEO", to: "/admin/seo", icon: BarChart3, permission: "manage_marketing" },
  ] },
  { label: "Communication", items: [
    { label: "Notifications", to: "/app/notifications", icon: Bell, permission: "view_notifications", badge: 3 },
    { label: "AI Assistant", to: "/app/assistant", icon: Bot },
  ] },
  { label: "System", items: [
    { label: "Users", to: "/admin/users", icon: Users, permission: "view_users" },
    { label: "Roles & Permissions", to: "/admin/roles", icon: ShieldCheck, superAdminOnly: true },
    { label: "Branches", to: "/admin/branches", icon: GitBranch, superAdminOnly: true },
    { label: "Settings", to: "/admin/settings", icon: Settings, superAdminOnly: true },
    { label: "Backups", to: "/admin/backups", icon: DatabaseBackup, superAdminOnly: true },
    { label: "System Health", to: "/admin/health", icon: Activity, superAdminOnly: true },
    { label: "Audit Logs", to: "/admin/audit", icon: ScrollText, superAdminOnly: true },
    { label: "Integration Status", to: "/dev/integration-status", icon: Plug, ready: true },
  ] },
];
