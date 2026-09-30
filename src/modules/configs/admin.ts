import { LayoutTemplate, Newspaper, CalendarRange, Image, Star, FolderOpen, Megaphone, BarChart3, Plug, Users, ShieldCheck, GitBranch, Building2, Settings, DatabaseBackup, Activity, ScrollText, UserCircle, BrainCircuit } from "lucide-react";
import { endpoints } from "@/api/registry";
import type { ModuleConfig } from "../types";
import { at, code, day, patientAt, pick } from "../seedKit";

const CMS = "Content editing has no JSON API yet — edits are development data. The public site reads the real public API.";
const SYS = "No JSON API for this in the clinic system yet — development data only.";
const PUB = ["draft", "published", "archived"] as const;

const content = (key: string, title: string, singular: string, icon: ModuleConfig["icon"], titles: string[], extra: ModuleConfig["fields"] = []): ModuleConfig => ({
  key, title, singular, section: "Content & Marketing", icon, description: `Create and publish ${title.toLowerCase()}.`, permission: "manage_marketing", managePermission: "manage_marketing", backendNote: CMS,
  columns: [{ key: "title", label: "Title" }, { key: "author", label: "Author", hideOnMobile: true }, { key: "updated_at", label: "Updated", format: "date", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
  fields: [{ name: "title", label: "Title", type: "text", required: true }, { name: "slug", label: "URL slug", type: "text" }, ...extra, { name: "body", label: "Content", type: "textarea", required: true, wide: true }, { name: "status", label: "Status", type: "select", options: PUB, required: true }],
  filters: [{ key: "status", label: "Status", options: PUB }],
  actions: [{ key: "publish", label: "Publish", to: "published", when: (r) => r["status"] !== "published" }, { key: "unpublish", label: "Unpublish", to: "draft", when: (r) => r["status"] === "published" }, { key: "archive", label: "Archive", to: "archived", danger: true, when: (r) => r["status"] !== "archived" }],
  canCreate: true, canEdit: true, canDelete: true, seedCount: titles.length,
  seed: (i) => ({ title: `${pick(titles, i)} (dev)`, slug: pick(titles, i).toLowerCase().replace(/[^a-z0-9]+/g, "-"), author: "Content team", body: "Development content.", updated_at: at(-i * 3), status: pick(["published", "published", "draft"], i) }),
});

export const adminModules: ModuleConfig[] = [
  content("cms-pages", "Pages", "Page", LayoutTemplate, ["About us", "Our services", "Privacy policy", "Terms of service", "FAQ"]),
  content("blog", "Blog", "Post", Newspaper, ["Oral health tips", "Why floss daily", "Kids' first dental visit", "Teeth whitening facts", "Managing sensitivity"], [{ name: "category", label: "Category", type: "select", options: ["Oral health", "Clinic news", "Kids", "Cosmetic"] }]),
  content("news", "News", "News item", Newspaper, ["New Kerugoya branch hours", "Free check-up week", "New X-ray equipment"]),
  content("events", "Events", "Event", CalendarRange, ["School dental screening", "World Oral Health Day", "Community outreach"], [{ name: "event_date", label: "Event date", type: "date", required: true }]),
  {
    key: "gallery", title: "Gallery", singular: "Image", section: "Content & Marketing", icon: Image, description: "Clinic photos for the public gallery.", permission: "manage_marketing", managePermission: "manage_marketing", backendNote: CMS,
    columns: [{ key: "title", label: "Title" }, { key: "image_url", label: "Image URL", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "title", label: "Title", type: "text", required: true }, { name: "image_url", label: "Image URL (https)", type: "text", required: true, wide: true }, { name: "status", label: "Status", type: "select", options: PUB, required: true }],
    actions: [{ key: "publish", label: "Publish", to: "published", when: (r) => r["status"] !== "published" }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 6,
    seed: (i) => ({ title: pick(["Reception", "Waiting area", "Treatment room", "X-ray room", "Team", "Kids corner"], i), image_url: "https://example.com/placeholder.jpg", status: "published" }),
  },
  {
    key: "testimonials", title: "Testimonials", singular: "Testimonial", section: "Content & Marketing", icon: Star, description: "Moderate patient testimonials before they go public.", permission: "manage_marketing", managePermission: "manage_marketing", backendNote: CMS + " Seed entries are fictional and must not be published.",
    columns: [{ key: "name", label: "From" }, { key: "rating", label: "Rating" }, { key: "content", label: "Text", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "rating", label: "Rating (1–5)", type: "number", required: true, min: 1 }, { name: "content", label: "Testimonial", type: "textarea", required: true, wide: true }],
    filters: [{ key: "status", label: "Status", options: ["pending", "approved", "rejected"] }],
    actions: [{ key: "approve", label: "Approve", to: "approved", when: (r) => r["status"] !== "approved" }, { key: "reject", label: "Reject", to: "rejected", danger: true, when: (r) => r["status"] === "pending" }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 5,
    seed: (i) => ({ name: `Sample reviewer ${i + 1} (dev)`, rating: 4 + (i % 2), content: "Fictional development testimonial — do not publish.", status: pick(["pending", "pending", "rejected"], i) }),
  },
  {
    key: "media", title: "Media Library", singular: "File", section: "Content & Marketing", icon: FolderOpen, description: "Images and documents used across the site.", permission: "manage_marketing", managePermission: "manage_marketing", backendNote: CMS,
    columns: [{ key: "filename", label: "File" }, { key: "type", label: "Type", format: "status" }, { key: "size_kb", label: "Size (KB)", hideOnMobile: true }, { key: "uploaded_at", label: "Uploaded", format: "date", hideOnMobile: true }],
    fields: [{ name: "filename", label: "File name", type: "text", required: true }, { name: "type", label: "Type", type: "select", options: ["image", "pdf", "video"], required: true }, { name: "url", label: "URL", type: "text", required: true, wide: true }],
    canCreate: true, canEdit: false, canDelete: true, seedCount: 8,
    seed: (i) => ({ filename: `asset-${i + 1}.${pick(["jpg", "png", "pdf"], i)}`, type: pick(["image", "image", "pdf"], i), size_kb: 120 + i * 37, uploaded_at: day(-i * 5), url: "https://example.com/asset" }),
  },
  {
    key: "campaigns", title: "Campaigns", singular: "Campaign", section: "Content & Marketing", icon: Megaphone, description: "Marketing campaigns with UTM links and conversions.", permission: "manage_marketing", managePermission: "manage_marketing",
    backendNote: "Public campaigns are read from the real API on the website; admin editing is development data (no admin API yet).",
    columns: [{ key: "name", label: "Campaign" }, { key: "channel", label: "Channel", format: "status", hideOnMobile: true }, { key: "utm_link", label: "Tracking link", hideOnMobile: true }, { key: "clicks", label: "Clicks" }, { key: "conversions", label: "Bookings" }, { key: "status", label: "Status", format: "status" }],
    fields: [
      { name: "name", label: "Campaign name", type: "text", required: true }, { name: "channel", label: "Channel", type: "select", options: ["facebook", "instagram", "google", "sms", "email", "whatsapp"], required: true },
      { name: "utm_campaign", label: "UTM campaign", type: "text", required: true, help: "Used to build the tracking link." }, { name: "starts_on", label: "Starts", type: "date", required: true }, { name: "ends_on", label: "Ends", type: "date" },
      { name: "offer", label: "Offer / message", type: "textarea", wide: true },
    ],
    filters: [{ key: "status", label: "Status", options: ["draft", "active", "paused", "ended"] }],
    actions: [
      { key: "activate", label: "Activate", to: "active", when: (r) => ["draft", "paused"].includes(String(r["status"])), mock: (r) => ({ utm_link: `/?utm_source=${String(r["channel"])}&utm_campaign=${String(r["utm_campaign"])}` }) },
      { key: "pause", label: "Pause", to: "paused", when: (r) => r["status"] === "active" },
      { key: "end", label: "End campaign", to: "ended", danger: true, confirm: "End this campaign?", when: (r) => r["status"] !== "ended" },
    ],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 6,
    seed: (i) => { const ch = pick(["facebook", "google", "sms", "instagram"], i); const u = pick(["free-checkup", "whitening-oct", "kids-smile", "back-to-school"], i); return { name: `${pick(["Free check-up week", "Whitening October", "Kids smile month", "Back to school"], i)} (dev)`, channel: ch, utm_campaign: u, utm_link: `/?utm_source=${ch}&utm_campaign=${u}`, starts_on: day(-i * 10), ends_on: day(30 - i * 10), clicks: 120 * (i + 1), conversions: 7 * (i + 1), offer: null, status: pick(["active", "paused", "ended", "draft"], i) }; },
  },
  {
    key: "seo", title: "SEO & Google", singular: "Page setting", section: "Content & Marketing", icon: BarChart3, description: "Titles, descriptions and indexing per page.", permission: "manage_marketing", managePermission: "manage_marketing", backendNote: SYS,
    columns: [{ key: "path", label: "Page" }, { key: "meta_title", label: "Title" }, { key: "indexed", label: "Indexed", format: "bool" }],
    fields: [{ name: "path", label: "Path", type: "text", required: true }, { name: "meta_title", label: "Meta title (≤60)", type: "text", required: true }, { name: "meta_description", label: "Meta description (≤160)", type: "textarea", required: true, wide: true }, { name: "indexed", label: "Allow search engines", type: "checkbox" }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 6,
    seed: (i) => ({ path: pick(["/", "/services", "/doctors", "/appointments", "/blog", "/contact"], i), meta_title: pick(["Munab Nursing Home", "Dental services", "Our dentists", "Book a visit", "Dental blog", "Contact us"], i), meta_description: "Development SEO description.", indexed: true }),
  },
  {
    key: "integrations", title: "Integrations", singular: "Integration", section: "Content & Marketing", icon: Plug, description: "M-Pesa, SMS, email, Google, Meta and social connections.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "name", label: "Integration" }, { key: "category", label: "Category", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }, { key: "last_checked", label: "Last checked", format: "datetime", hideOnMobile: true }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "category", label: "Category", type: "select", options: ["payments", "messaging", "analytics", "social"], required: true }],
    actions: [{ key: "test", label: "Test connection", mock: () => ({ last_checked: new Date().toISOString() }), mockOnly: "Connection tests run in development mode only." }, { key: "disable", label: "Disable", to: "disabled", danger: true, when: (r) => r["status"] !== "disabled" }, { key: "enable", label: "Enable", to: "connected", when: (r) => r["status"] === "disabled" }],
    canCreate: false, canEdit: false, canDelete: false, seedCount: 6,
    seed: (i) => ({ name: pick(["M-Pesa Daraja", "Africa's Talking SMS", "SMTP email", "Google Analytics", "Meta Pixel", "Google Business"], i), category: pick(["payments", "messaging", "messaging", "analytics", "social", "social"], i), status: pick(["connected", "connected", "not_configured"], i), last_checked: at(0, 8) }),
  },
  {
    key: "users", title: "Users", singular: "User", section: "System", icon: Users, description: "Staff accounts and roles.", permission: "view_users", managePermission: ["create_users", "edit_users"],
    columns: [{ key: "name", label: "Name" }, { key: "email", label: "Email", hideOnMobile: true }, { key: "role|roles.0", label: "Role", format: "status" }, { key: "is_active", label: "Active", format: "bool" }],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true }, { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Role", type: "select", options: ["super_admin", "admin", "dentist", "nurse", "receptionist", "cashier", "accountant", "inventory_manager", "lab_staff"], required: true },
      { name: "password", label: "Temporary password (min 8)", type: "text", required: true, help: "User must change it on first sign-in." },
    ],
    actions: [{ key: "deactivate", label: "Deactivate", danger: true, confirm: "Deactivate this user? They will be signed out.", when: (r) => r["is_active"] === true, mock: () => ({ is_active: false }) }, { key: "activate", label: "Reactivate", when: (r) => r["is_active"] === false, mock: () => ({ is_active: true }) }],
    canCreate: true, canEdit: true, canDelete: true,
    laravel: { list: endpoints.users.list, detail: endpoints.users.detail, create: true, update: true, remove: true },
    seedCount: 14,
    seed: (i) => ({ name: `${pick(["Achieng", "Mwangi", "Grace", "Otieno", "Wanjiru", "Kiprop", "Njoroge"], i)} Staff ${i + 1} (dev)`, email: `staff${i + 1}@dev.local`, role: pick(["dentist", "receptionist", "cashier", "nurse", "inventory_manager", "accountant", "lab_staff"], i), is_active: i % 9 !== 0, password: undefined }),
  },
  {
    key: "roles", title: "Roles & Permissions", singular: "Role", section: "System", icon: ShieldCheck, description: "What each role can see and do.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "name", label: "Role", format: "status" }, { key: "permissions", label: "Permissions" }, { key: "users", label: "Users" }],
    fields: [{ name: "name", label: "Role name", type: "text", required: true }, { name: "permissions", label: "Permissions (comma separated)", type: "textarea", required: true, wide: true }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 9,
    seed: (i) => ({ name: pick(["super_admin", "admin", "dentist", "nurse", "receptionist", "cashier", "accountant", "inventory_manager", "lab_staff"], i), permissions: pick(["all", "view_patients, view_appointments, view_queue", "view_consultations, create_prescriptions", "view_invoices, create_payments", "view_inventory"], i), users: 1 + (i % 4) }),
  },
  {
    key: "branches", title: "Branches", singular: "Branch", section: "System", icon: GitBranch, description: "Clinic locations and performance.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "name", label: "Branch" }, { key: "town", label: "Town" }, { key: "patients", label: "Patients" }, { key: "revenue_month", label: "Revenue (month)", format: "money", hideOnMobile: true }, { key: "is_active", label: "Active", format: "bool" }],
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "town", label: "Town", type: "text", required: true }, { name: "phone", label: "Phone", type: "tel" }],
    actions: [{ key: "toggle", label: "Activate / deactivate", confirm: "Change this branch's active state?", mock: (r) => ({ is_active: !r["is_active"] }) }],
    canCreate: true, canEdit: true, canDelete: false, seedCount: 2,
    seed: (i) => ({ name: pick(["Munab — Main (dev)", "Munab — Annex (dev)"], i), town: "Nairobi", phone: null, patients: 600 + i * 48, revenue_month: 820000 - i * 120000, is_active: true }),
  },
  {
    key: "organization", title: "Organization", singular: "Setting", section: "System", icon: Building2, description: "Clinic identity, branding and theme.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "label", label: "Setting" }, { key: "value", label: "Value" }],
    fields: [{ name: "label", label: "Setting", type: "text", required: true }, { name: "value", label: "Value", type: "text", required: true, wide: true }],
    canCreate: false, canEdit: true, canDelete: false, seedCount: 6,
    seed: (i) => pick([{ label: "Clinic name", value: "Munab Nursing Home" }, { label: "Phone", value: "0757 117 313" }, { label: "Primary colour", value: "Deep navy" }, { label: "Accent colour", value: "Lemon yellow" }, { label: "Currency", value: "KES" }, { label: "Time zone", value: "Africa/Nairobi" }], 5 - i),
  },
  {
    key: "settings", title: "Settings", singular: "Setting", section: "System", icon: Settings, description: "System mode, fees display, payments and policies.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "group", label: "Group", format: "status" }, { key: "label", label: "Setting" }, { key: "value", label: "Value" }],
    fields: [{ name: "value", label: "Value", type: "text", required: true, wide: true }],
    canCreate: false, canEdit: true, canDelete: false, seedCount: 6,
    seed: (i) => pick([{ group: "system", label: "System mode", value: "live" }, { group: "payments", label: "M-Pesa till", value: "Not configured" }, { group: "appointments", label: "Slot length (min)", value: "30" }, { group: "security", label: "Session timeout (min)", value: "60" }, { group: "notifications", label: "SMS reminders", value: "on" }, { group: "billing", label: "Invoice prefix", value: "INV" }], 5 - i),
  },
  {
    key: "portal-accounts", title: "Patient Portal", singular: "Portal account", section: "System", icon: UserCircle, description: "Patient portal access.", permission: "view_patients", managePermission: "edit_patients", backendNote: "No patient portal JSON API yet.",
    columns: [{ key: "patient_name", label: "Patient" }, { key: "email", label: "Login email" }, { key: "last_login", label: "Last login", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "patient_id", label: "Patient", type: "patient", required: true }, { name: "email", label: "Login email", type: "email", required: true }],
    actions: [{ key: "invite", label: "Send invite", to: "invited", when: (r) => r["status"] === "not_invited" }, { key: "disable", label: "Disable access", to: "disabled", danger: true, confirm: "Disable portal access for this patient?", when: (r) => r["status"] === "active" }, { key: "enable", label: "Enable access", to: "active", when: (r) => r["status"] === "disabled" }],
    canCreate: true, canEdit: false, seedCount: 20,
    seed: (i) => ({ ...patientAt(i), email: `patient${i + 1}@example.com`, last_login: i % 3 ? at(-i) : null, status: pick(["active", "invited", "not_invited", "disabled"], i) }),
  },
  {
    key: "ai-knowledge", title: "AI Knowledge", singular: "Knowledge item", section: "System", icon: BrainCircuit, description: "Facts the clinic assistant may use.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "topic", label: "Topic" }, { key: "audience", label: "Audience", format: "status" }, { key: "updated_at", label: "Updated", format: "date", hideOnMobile: true }],
    fields: [{ name: "topic", label: "Topic", type: "text", required: true }, { name: "audience", label: "Audience", type: "select", options: ["public", "patients", "staff"], required: true }, { name: "answer", label: "Answer", type: "textarea", required: true, wide: true }],
    canCreate: true, canEdit: true, canDelete: true, seedCount: 4,
    seed: (i) => ({ topic: pick(["How to book", "Consultation fee", "Payment methods", "Opening hours"], i), audience: "public", answer: "Development answer.", updated_at: day(-i) }),
  },
  {
    key: "audit-logs", title: "Audit Logs", singular: "Log entry", section: "System", icon: ScrollText, description: "Who did what, when.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "at", label: "When", format: "datetime" }, { key: "user", label: "User" }, { key: "event", label: "Event", format: "status" }, { key: "subject", label: "Subject", hideOnMobile: true }],
    fields: [], filters: [{ key: "event", label: "Event", options: ["created", "updated", "deleted", "login", "payment"] }], canCreate: false, canEdit: false, canDelete: false, seedCount: 80,
    seed: (i) => ({ at: at(0, 9, -i * 11), user: `staff${(i % 7) + 1}@dev.local`, event: pick(["created", "updated", "login", "payment", "deleted"], i), subject: pick(["Patient", "Appointment", "Invoice", "Payment", "Product"], i) + ` #${1000 + i}` }),
  },
  {
    key: "backups", title: "Backups", singular: "Backup", section: "System", icon: DatabaseBackup, description: "Create, verify, download and restore backups.", superAdminOnly: true,
    backendNote: "No backup JSON API — nothing is really backed up or restored from here.",
    columns: [{ key: "name", label: "Backup" }, { key: "type", label: "Type", format: "status" }, { key: "size_mb", label: "Size (MB)" }, { key: "checksum", label: "Checksum", hideOnMobile: true }, { key: "created_at", label: "Created", format: "datetime", hideOnMobile: true }, { key: "status", label: "Status", format: "status" }],
    fields: [{ name: "type", label: "Type", type: "select", options: ["full", "database", "files"], required: true }, { name: "note", label: "Note", type: "text" }],
    actions: [
      { key: "verify", label: "Verify integrity", mock: () => ({ status: "verified" }), when: (r) => r["status"] === "completed" },
      { key: "download", label: "Details / download", view: true },
      { key: "restore", label: "Restore", danger: true, confirm: "Restore this backup? In a live system this overwrites current data.", mock: () => ({ restored_at: new Date().toISOString() }), mockOnly: "Development restore simulation — no data was changed." },
    ],
    canCreate: true, canEdit: false, canDelete: true, seedCount: 10,
    seed: (i) => ({ name: `backup-2026-09-${String(30 - i).padStart(2, "0")}`, type: pick(["full", "database", "database"], i), size_mb: 240 + i * 13, checksum: `sha256:${(0xa1b2c3 + i * 7919).toString(16)}…`, created_at: at(-i, 2), status: i === 0 ? "completed" : "verified", note: null }),
  },
  {
    key: "system-health", title: "System Health", singular: "Service", section: "System", icon: Activity, description: "Database, Redis, cache, queue, scheduler, storage and API.", superAdminOnly: true, backendNote: SYS,
    columns: [{ key: "service", label: "Service" }, { key: "status", label: "Status", format: "status" }, { key: "latency_ms", label: "Latency (ms)" }, { key: "checked_at", label: "Checked", format: "datetime", hideOnMobile: true }],
    fields: [],
    actions: [{ key: "check", label: "Run check", mock: (r) => ({ checked_at: new Date().toISOString(), latency_ms: Number(r["latency_ms"]) }) }, { key: "flush", label: "Clear cache", confirm: "Clear this service's cache?", when: (r) => ["Redis", "Cache"].includes(String(r["service"])), mock: () => ({ checked_at: new Date().toISOString() }) }],
    canCreate: false, canEdit: false, canDelete: false, seedCount: 8,
    seed: (i) => ({ service: pick(["Database", "Redis", "Cache", "Queue worker", "Scheduler (cron)", "Storage", "Laravel API", "Mail"], 7 - i), status: "operational", latency_ms: 3 + i * 4, checked_at: at(0, 9) }),
  },
];
