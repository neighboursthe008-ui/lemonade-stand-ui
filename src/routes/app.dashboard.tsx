import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, ArrowUpRight, BadgeDollarSign, Bell, CalendarCheck, CalendarDays, CheckCircle2, ClipboardList, Cloud, FilePlus2,
  Newspaper, Package, Phone, Plus, ShoppingBag, SquarePen, Stethoscope, TriangleAlert, UserPlus, Users, Wallet, Clock, FileText,
} from "lucide-react";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { overview, revenueByRange, type Range } from "@/mocks/dashboard/overview";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Lemonade Staff" },
    { name: "description", content: "Today's patients, appointments, revenue and clinic health at a glance." },
    { property: "og:title", content: "Dashboard — Lemonade Staff" },
    { property: "og:description", content: "Clinic overview for Lemonade Dental staff." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const ksh = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;
const mock = () => toast.info("Available once this module is connected to the clinic system.");

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
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("7d");
  const o = overview;
  const total = o.apptBreakdown.reduce((a, b) => a + b.value, 0);

  const kpis = [
    { icon: Users, label: "Patients", value: o.kpis.patients.toLocaleString(), sub: <><ArrowUpRight className="h-4 w-4 text-success" /><b className="text-success">{o.kpis.patientsTrend}</b> this month</> },
    { icon: CalendarDays, label: "Today's Appointments", value: String(o.kpis.appointments), sub: <><span className="h-2.5 w-2.5 rounded-full bg-lemon" />{o.kpis.pending} pending</> },
    { icon: Wallet, label: "Today's Revenue", value: ksh(o.kpis.revenue), sub: <><ArrowUpRight className="h-4 w-4 text-success" /><b className="text-success">{o.kpis.revenueTrend}</b> today</> },
    { icon: ShoppingBag, label: "Pending Orders", value: String(o.kpis.orders), sub: <><span className="h-2.5 w-2.5 rounded-full bg-lemon" />{o.kpis.awaitingPayment} awaiting payment</> },
  ];

  const quick = [
    { icon: UserPlus, label: "Register Patient", primary: true }, { icon: CalendarCheck, label: "Book Appointment" },
    { icon: FilePlus2, label: "Create Invoice" }, { icon: BadgeDollarSign, label: "Record Payment" },
    { icon: Package, label: "Add Product" }, { icon: Newspaper, label: "Create News" },
    { icon: SquarePen, label: "Create Blog Post" }, { icon: Cloud, label: "Create Campaign" },
  ];

  return (
    <div className="space-y-4">
      <MockDataBanner reason="Laravel dashboard API not available yet" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">{greeting()}, {user?.name}</h1>
          <p className="text-primary/80">Here's what's happening at Lemonade Dental Clinic today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-primary"><span className="h-2.5 w-2.5 rounded-full bg-success" />All systems operational</span>
          <button onClick={mock} className="flex items-center gap-2 rounded-xl bg-lemon px-5 py-2.5 font-semibold text-lemon-foreground shadow-sm hover:brightness-95"><Plus className="h-5 w-5" />Quick Action</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Card title="Revenue Overview" icon={CalendarDays} className="xl:col-span-2" right={
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
        </Card>

        <Card title="Today's Appointments" icon={CalendarDays}>
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
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title="Today's Schedule" icon={CalendarDays} className="xl:col-span-2">
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
                    <td className="px-3 py-2.5"><button onClick={mock} className="rounded-md border px-3 py-1 text-xs text-primary hover:bg-muted">View</button><span className="ml-3 text-muted-foreground">···</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Waiting List" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
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
          <button onClick={mock} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-lemon py-2.5 text-sm font-semibold text-lemon-foreground hover:brightness-95"><Phone className="h-4 w-4" />Call Next Patient</button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="space-y-4">
          <Card title="Clinical Overview" icon={ClipboardList}>
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
          </Card>
          <Card title="Quick Actions" icon={Activity}>
            <div className="grid grid-cols-4 gap-2">
              {quick.map((q) => (
                <button key={q.label} onClick={mock} className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-[11px] leading-tight text-primary ${q.primary ? "border-lemon bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>
                  <q.icon className="h-5 w-5" />{q.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Financial Snapshot" icon={BadgeDollarSign}>
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
              <button onClick={mock} className="rounded-md bg-lemon px-4 py-2 text-xs font-semibold text-lemon-foreground">View Accounting</button>
              <button onClick={mock} className="rounded-md border border-primary px-4 py-2 text-xs font-medium text-primary">View Reports</button>
            </div>
          </div>
        </Card>

        <Card title="System Health" icon={Activity} className="lg:col-span-2 xl:col-span-1">
          <ul className="space-y-1.5 text-xs">
            {o.health.map((h) => (
              <li key={h} className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /><span className="flex-1">{h}</span>
                <span className="h-2 w-2 rounded-full bg-success" /><span className="w-20 text-muted-foreground">Operational</span></li>
            ))}
          </ul>
          <button onClick={mock} className="mt-3 w-full rounded-md border py-1.5 text-xs font-medium text-primary hover:bg-muted">View System Health</button>
          <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary"><Bell className="h-4 w-4" />Recent Activity</h3>
          <ul className="mt-2 space-y-2 border-l-2 border-accent pl-3 text-[11px]">
            {o.activity.map((a) => (
              <li key={a.text} className="flex justify-between gap-2"><span className="text-primary">{a.text}</span><span className="flex shrink-0 items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{a.at}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-6 border-t pt-3 text-xs text-primary">
        <span>Help</span><span>Documentation</span><span>Privacy</span><span>Terms</span>
        <span className="text-muted-foreground">© {new Date().getFullYear()} Lemonade Dental Clinic</span>
      </footer>
    </div>
  );
}
