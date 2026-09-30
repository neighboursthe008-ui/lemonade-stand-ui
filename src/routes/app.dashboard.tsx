import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { moduleByKey } from "@/modules/registry";
import { getService, mockRows } from "@/modules/service";
import { mockPatientList } from "@/mocks/patients/MockPatientRepository";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, ArrowUpRight, BadgeDollarSign, Bell, CalendarCheck, CalendarDays, CheckCircle2, ClipboardList, Cloud, FilePlus2,
  Newspaper, Package, Phone, FlaskConical, Boxes, Receipt, Pill as PillIcon, Plus, ShoppingBag, SquarePen, Stethoscope, TriangleAlert, UserPlus, Users, Wallet, Clock, FileText,
} from "lucide-react";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { overview, revenueByRange, extraKpis, lowStock, openInvoices, activityPerm, type Range } from "@/mocks/dashboard/overview";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Munab Staff" },
    { name: "description", content: "Today's patients, appointments, revenue and clinic health at a glance." },
    { property: "og:title", content: "Dashboard — Munab Staff" },
    { property: "og:description", content: "Clinic overview for Munab staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const ksh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

function Card({ title, icon: Icon, right, children, className = "" }: { title: string; icon: typeof Users; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary"><Icon className="h-5 w-5" />{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const statusCls: Record<string, string> = {
  Confirmed: "bg-success/15 text-success",
  "Checked In": "bg-aqua/20 text-primary",
  Waiting: "bg-lemon/40 text-lemon-foreground",
  Completed: "bg-success/15 text-success",
  Called: "bg-aqua/20 text-primary",
};
const Pill = ({ s }: { s: string }) => <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-medium ${statusCls[s]}`}>{s}</span>;
const Avatar = ({ name }: { name: string }) => (
  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{name.split(" ").map((p) => p[0]).join("")}</span>
);
const Legend = ({ items }: { items: [string, string][] }) => (
  <div className="flex flex-wrap gap-4 text-xs">{items.map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</span>)}</div>
);

function greeting() { const h = new Date().getHours(); return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"; }

function Dashboard() {
  const { user, can, isDevSession } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const queueCfg = moduleByKey("queue")!;
  const callNext = useMutation({
    mutationFn: () => getService(queueCfg, isDevSession).pageAction("callNext"),
    onSuccess: async (r) => { await qc.invalidateQueries({ queryKey: ["module", "queue"] }); toast.success(r.message); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not call next patient"),
  });
  // Live counts from the same development records the module pages use (consistent everywhere).
  const today = new Date(Date.UTC(2026, 8, 30)).toISOString().slice(0, 10);
  const appts = mockRows(moduleByKey("appointments")!);
  const todays = appts.filter((a) => String(a["scheduled_at"]).slice(0, 10) === today);
  const queueRows = mockRows(queueCfg);
  const inv = mockRows(moduleByKey("invoices")!);
  const stock = mockRows(moduleByKey("inventory")!);
  const orders = mockRows(moduleByKey("orders")!);
  const [range, setRange] = useState<Range>("7d");
  const o = overview;
  const total = o.apptBreakdown.reduce((a, b) => a + b.value, 0);

  const up = (t: string, w: string) => <><ArrowUpRight className="h-4 w-4 text-success" /><b className="text-success">{t}</b> {w}</>;
  const dot = (t: string) => <><span className="h-2.5 w-2.5 rounded-full bg-lemon" />{t}</>;
  const x = extraKpis;
  const catalog = {
    patients: { perm: "view_patients", icon: Users, label: "Patients", value: mockPatientList().length.toLocaleString(), sub: up(o.kpis.patientsTrend, "this month") },
    appts: { perm: "view_appointments", icon: CalendarDays, label: "Today's Appointments", value: String(todays.length), sub: dot(`${todays.filter((a) => ["scheduled", "confirmed"].includes(String(a["status"]))).length} not yet checked in`) },
    revenue: { perm: ["view_accounting", "view_reports"], icon: Wallet, label: "Today's Revenue", value: ksh(o.kpis.revenue), sub: up(o.kpis.revenueTrend, "today") },
    collected: { perm: "view_payments", icon: BadgeDollarSign, label: "Collected Today", value: ksh(x.collectedToday), sub: dot("14 M-Pesa payments") },
    invoices: { perm: "view_invoices", icon: Receipt, label: "Open Invoices", value: String(inv.filter((r) => ["sent", "partial", "overdue"].includes(String(r["status"]))).length), sub: dot("6 overdue") },
    orders: { perm: "view_inventory", icon: ShoppingBag, label: "Pending Orders", value: String(orders.filter((r) => ["pending", "processing"].includes(String(r["status"]))).length), sub: dot(`${orders.filter((r) => r["payment_status"] === "awaiting_payment").length} awaiting payment`) },
    lowStock: { perm: "view_inventory", icon: Boxes, label: "Low Stock Items", value: String(stock.filter((r) => Number(r["stock"]) <= Number(r["minimum_stock"])).length), sub: dot("3 expiring in 30 days") },
    waiting: { perm: "view_queue", icon: Clock, label: "Waiting Now", value: String(queueRows.filter((r) => r["status"] === "waiting").length), sub: dot("longest 18 min") },
    consult: { perm: "view_consultations", icon: Stethoscope, label: "In Consultation", value: String(x.inConsultation), sub: dot(`${o.clinical.completed} completed today`) },
    lab: { perm: "view_lab_orders", icon: FlaskConical, label: "Lab Results Pending", value: String(x.labPending), sub: dot("1 urgent") },
    rx: { perm: "prescribe_medication", icon: PillIcon, label: "Prescriptions Today", value: String(x.rxToday), sub: dot("issued by you") },
    newPts: { perm: "create_patients", icon: UserPlus, label: "New Registrations", value: String(x.newRegistrations), sub: dot("today") },
  } as const;
  type K = keyof typeof catalog;
  const order: Record<string, K[]> = {
    super_admin: ["patients", "appts", "revenue", "orders"],
    dentist: ["waiting", "consult", "lab", "rx"],
    receptionist: ["appts", "waiting", "newPts", "patients"],
    cashier: ["collected", "invoices", "patients", "revenue"],
    inventory_manager: ["lowStock", "orders", "revenue", "patients"],
  };
  const role = user?.roles[0] ?? "";
  const pref = order[role] ?? (Object.keys(catalog) as K[]);
  const allowed = (k: K) => can(catalog[k].perm as string | string[]);
  const kpis = [...pref, ...(Object.keys(catalog) as K[])].filter((k, i, a) => a.indexOf(k) === i && allowed(k)).slice(0, 4).map((k) => catalog[k]);

  const quick = [
    { icon: UserPlus, label: "Register Patient", perm: "create_patients", mod: "patients/new" }, { icon: CalendarCheck, label: "Book Appointment", perm: "create_appointments", mod: "appointments" },
    { icon: FilePlus2, label: "Create Invoice", perm: "create_invoices", mod: "invoices" }, { icon: BadgeDollarSign, label: "Record Payment", perm: "create_payments", mod: "payments" },
    { icon: PillIcon, label: "Write Prescription", perm: "create_prescriptions", mod: "prescriptions" }, { icon: Package, label: "Add Product", perm: "view_inventory", mod: "inventory" },
    { icon: Newspaper, label: "Create News", perm: "manage_marketing", mod: "news" }, { icon: SquarePen, label: "Create Blog Post", perm: "manage_marketing", mod: "blog" },
    { icon: Cloud, label: "Create Campaign", perm: "manage_marketing", mod: "campaigns" },
  ].filter((q) => can(q.perm)).map((q, i) => ({ ...q, primary: i === 0 }));
  const openQuick = (mod: string) => (mod === "patients/new" ? nav({ to: "/app/patients/new" }) : nav({ to: "/app/$module", params: { module: mod }, search: { new: 1 } }));

  const show = {
    revenue: can(["view_accounting", "view_reports"]),
    appts: can("view_appointments"),
    queue: can("view_queue"),
    clinical: can("view_consultations"),
    financial: can(["view_invoices", "view_accounting"]),
    invoices: can("view_invoices") && !can("view_accounting"),
    inventory: can("view_inventory"),
    health: !!user?.is_super_admin,
  };
  const activity = o.activity.filter((a) => user?.is_super_admin || can(activityPerm[a.text] ?? "__none"));
  const isDentist = role === "dentist";
  const roleLabel = role.replace(/_/g, " ");

  return (
    <div className="space-y-4">
      <MockDataBanner reason="Laravel dashboard API not available yet" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">{greeting()}, {user?.name}</h1>
          <p className="text-primary/80">Here's what's happening at Munab Nursing Home today. <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">{roleLabel} view</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {show.health && <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-primary"><span className="h-2.5 w-2.5 rounded-full bg-success" />All systems operational</span>}
          {quick.length > 0 && <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="flex items-center gap-2 rounded-xl bg-lemon px-5 py-2.5 font-semibold text-lemon-foreground shadow-sm hover:brightness-95"><Plus className="h-5 w-5" />Quick Action</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">{quick.map((q) => <DropdownMenuItem key={q.label} onSelect={() => openQuick(q.mod)}><q.icon className="mr-2 h-4 w-4" />{q.label}</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${["xl:grid-cols-1", "xl:grid-cols-1", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4"][kpis.length]}`}>
        {kpis.map((k) => (
          <div key={k.label} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent text-primary"><k.icon className="h-7 w-7" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">{k.label}</p>
              <p className="truncate font-display text-2xl font-bold text-primary">{k.value}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {show.revenue && <Card title="Revenue Overview" icon={CalendarDays} className={show.appts ? "xl:col-span-2" : "xl:col-span-3"} right={
          <div className="flex overflow-hidden rounded-md border text-xs">
            {([["7d", "7 Days"], ["30d", "30 Days"], ["3m", "3 Months"], ["12m", "12 Months"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setRange(k)} className={`px-3 py-1.5 ${range === k ? "bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>{l}</button>
            ))}
          </div>
        }>
          <div className="-mt-2 mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-primary/80">Clinic revenue performance</p>
            <Legend items={[["Consultations", "var(--chart-1)"], ["Treatments", "var(--chart-2)"], ["Shop", "var(--chart-3)"]]} />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByRange[range]} margin={{ left: -10, right: 10 }}>
                <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toLocaleString()} />
                <Tooltip formatter={(v: number) => ksh(v)} />
                <Area type="monotone" dataKey="consultations" stroke="var(--chart-1)" strokeWidth={2} fill="url(#rv)" dot={{ r: 3 }} />
                <Area type="monotone" dataKey="treatments" stroke="var(--chart-2)" strokeWidth={2} fill="none" dot={{ r: 3 }} />
                <Area type="monotone" dataKey="shop" stroke="var(--chart-3)" strokeWidth={2} fill="none" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>}

        {show.appts && <Card title="Today's Appointments" icon={CalendarDays} className={show.revenue ? "" : "xl:col-span-3"}>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={o.apptBreakdown} dataKey="value" innerRadius={50} outerRadius={80} startAngle={90} endAngle={-270} stroke="none">
                  {o.apptBreakdown.map((b) => <Cell key={b.key} fill={b.color} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-2xl font-bold text-primary">{total}</p><p className="text-xs">Total</p></div></div>
            </div>
            <ul className="w-full space-y-4 text-sm">
              {o.apptBreakdown.map((b) => (
                <li key={b.key} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: b.color }} />
                  <span className="flex-1 text-primary">{b.label}</span><b>{b.value}</b><span className="w-12 text-right text-muted-foreground">({Math.round((b.value / total) * 100)}%)</span></li>
              ))}
            </ul>
          </div>
        </Card>}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {show.appts && <Card title={isDentist ? "My Schedule" : "Today's Schedule"} icon={CalendarDays} className={show.queue ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>{["Time", "Patient", "Service", "Provider", "Status", "Action"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {o.schedule.map((r) => (
                  <tr key={r.time} className="border-b last:border-0">
                    <td className="px-3 py-2.5 tabular-nums">{r.time}</td>
                    <td className="px-3 py-2.5"><span className="flex items-center gap-2"><Avatar name={r.patient} />{r.patient}</span></td>
                    <td className="px-3 py-2.5 text-xs text-primary/80">{r.service}</td>
                    <td className="px-3 py-2.5 text-xs">{r.provider}</td>
                    <td className="px-3 py-2.5"><Pill s={r.status} /></td>
                    <td className="px-3 py-2.5"><Link to="/app/$module" params={{ module: "appointments" }} className="rounded-md border px-3 py-1 text-xs text-primary hover:bg-muted">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>}

        {show.queue && <Card title="Waiting List" icon={Users} className={show.appts ? "" : "xl:col-span-3"}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr>{["#", "Patient", "Time", "Service", "Status"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {o.waiting.map((r) => (
                  <tr key={r.no} className="border-b last:border-0">
                    <td className="px-3 py-2.5">{r.no}</td><td className="px-3 py-2.5">{r.patient}</td>
                    <td className="px-3 py-2.5 tabular-nums">{r.time}</td><td className="px-3 py-2.5">{r.service}</td><td className="px-3 py-2.5"><Pill s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => callNext.mutate()} disabled={callNext.isPending} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-lemon py-2.5 text-sm font-semibold text-lemon-foreground hover:brightness-95"><Phone className="h-4 w-4" />{callNext.isPending ? "Calling…" : "Call Next Patient"}</button>
        </Card>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-4">
          {show.clinical && <Card title="Clinical Overview" icon={ClipboardList}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users, label: "Waiting Patients", v: o.clinical.waiting, cls: "bg-accent text-primary" },
                { icon: Stethoscope, label: "In Consultation", v: o.clinical.inConsultation, cls: "bg-accent text-primary" },
                { icon: CheckCircle2, label: "Completed Visits", v: o.clinical.completed, cls: "bg-aqua/20 text-aqua" },
                { icon: TriangleAlert, label: "No Shows", v: o.clinical.noShows, cls: "bg-destructive/10 text-destructive" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border p-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${c.cls}`}><c.icon className="h-5 w-5" /></span>
                  <p className="mt-2 text-xs text-primary">{c.label}</p><p className="font-display text-xl font-bold text-primary">{c.v}</p>
                </div>
              ))}
            </div>
          </Card>}
          {quick.length > 0 && <Card title="Quick Actions" icon={Activity}>
            <div className="grid grid-cols-4 gap-2">
              {quick.map((q) => (
                <button key={q.label} onClick={() => openQuick(q.mod)} className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-[11px] leading-tight text-primary ${q.primary ? "border-lemon bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>
                  <q.icon className="h-5 w-5" />{q.label}
                </button>
              ))}
            </div>
          </Card>}
        </div>

        {show.financial && <Card title="Financial Snapshot" icon={BadgeDollarSign}>
          <Legend items={[["Revenue", "var(--chart-1)"], ["Expenses", "var(--chart-2)"], ["Outstanding Invoices", "var(--chart-3)"], ["Payments", "var(--chart-4)"]]} />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-48 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o.financial} margin={{ left: -15 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip formatter={(v: number) => ksh(v)} />
                  <Bar dataKey="revenue" fill="var(--chart-1)" /><Bar dataKey="expenses" fill="var(--chart-2)" />
                  <Bar dataKey="outstanding" fill="var(--chart-3)" /><Bar dataKey="payments" fill="var(--chart-4)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-2 sm:flex-col">
              {can("view_accounting") && <Link to="/app/$module" params={{ module: "journal-entries" }} className="rounded-md bg-lemon px-4 py-2 text-center text-xs font-semibold text-lemon-foreground">View Accounting</Link>}
              <Link to="/app/reports" className="rounded-md border border-primary px-4 py-2 text-center text-xs font-medium text-primary">View Reports</Link>
            </div>
          </div>
        </Card>}

        {show.invoices && <Card title="Open Invoices" icon={Receipt}>
          <ul className="divide-y text-sm">
            {openInvoices.map((i) => (
              <li key={i.no} className="flex items-center justify-between gap-2 py-2">
                <div><p className="font-medium text-primary">{i.patient}</p><p className="text-xs text-muted-foreground">{i.no}</p></div>
                <div className="text-right"><p className="font-semibold">{ksh(i.amount)}</p><span className="rounded-full bg-lemon/40 px-2 text-[11px]">{i.status}</span></div>
              </li>
            ))}
          </ul>
        </Card>}

        {show.inventory && <Card title="Low Stock" icon={Boxes}>
          <ul className="space-y-3 text-sm">
            {lowStock.map((l) => (
              <li key={l.item}>
                <div className="flex justify-between"><span className="text-primary">{l.item}</span><span className="text-xs text-muted-foreground">{l.onHand} / {l.reorder}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-destructive" style={{ width: `${(l.onHand / l.reorder) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>}

        {activity.length > 0 && <Card title={show.health ? "System Health" : "Recent Activity"} icon={Activity}>
          {show.health && <><ul className="space-y-1.5 text-xs">
            {o.health.map((h) => (
              <li key={h} className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /><span className="flex-1">{h}</span>
                <span className="h-2 w-2 rounded-full bg-success" /><span className="w-20 text-muted-foreground">Operational</span></li>
            ))}
          </ul>
          <Link to="/app/$module" params={{ module: "system-health" }} className="mt-3 block w-full rounded-md border py-1.5 text-center text-xs font-medium text-primary hover:bg-muted">View System Health</Link></>}
          {show.health && <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"><Bell className="h-4 w-4" />Recent Activity</h3>}
          <ul className="mt-2 space-y-2 border-l-2 border-accent pl-3 text-[11px]">
            {activity.map((a) => (
              <li key={a.text} className="flex justify-between gap-2"><span className="text-primary">{a.text}</span><span className="flex shrink-0 items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{a.at}</span></li>
            ))}
          </ul>
        </Card>}
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-6 border-t pt-3 text-xs text-primary">
        <Link to="/app/assistant" className="hover:underline">Help</Link><Link to="/dev/integration-status" className="hover:underline">Integration status</Link>
        <span className="text-muted-foreground">© {new Date().getFullYear()} Munab Nursing Home</span>
      </footer>
    </div>
  );
}
