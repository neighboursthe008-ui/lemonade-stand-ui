import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
import { endpoints } from "@/api/registry";
import { request, shouldRetryRead } from "@/api/client/http";
import { useAuth } from "@/stores/auth";
import { moduleByKey } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import { formatValue, humanize } from "@/modules/format";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [
    { title: "Reports — Lemonade Staff" }, { name: "description", content: "Revenue, appointments, financial and inventory reports." },
    { property: "og:title", content: "Reports — Lemonade Staff" }, { property: "og:description", content: "Clinic reports." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Reports,
});

const TABS = ["revenue", "appointments", "financial", "inventory"] as const;
type Tab = (typeof TABS)[number];

function count<T extends Record<string, unknown>>(rows: T[], key: string) {
  const m = new Map<string, number>(); rows.forEach((r) => m.set(String(r[key] ?? "unknown"), (m.get(String(r[key] ?? "unknown")) ?? 0) + 1));
  return [...m].map(([label, value]) => ({ label: humanize(label), value }));
}
function sum<T extends Record<string, unknown>>(rows: T[], key: string, by: string) {
  const m = new Map<string, number>(); rows.forEach((r) => m.set(String(r[by]), (m.get(String(r[by])) ?? 0) + Number(r[key] ?? 0)));
  return [...m].map(([label, value]) => ({ label: humanize(label), value }));
}

/** Mock aggregates are computed from the same development records the module pages show, so numbers are consistent. */
function mockReport(tab: Tab, from: string, to: string) {
  const inRange = (d: unknown) => { const s = String(d ?? "").slice(0, 10); return (!from || s >= from) && (!to || s <= to); };
  if (tab === "revenue") return sum(mockRows(moduleByKey("payments")!).filter((r) => inRange(r["paid_at"])), "amount", "payment_method");
  if (tab === "appointments") return count(mockRows(moduleByKey("appointments")!).filter((r) => inRange(r["scheduled_at"])), "status");
  if (tab === "financial") return sum(mockRows(moduleByKey("invoices")!).filter((r) => inRange(r["invoice_date"])), "balance", "status");
  return mockRows(moduleByKey("inventory")!).filter((r) => Number(r["stock"]) <= Number(r["minimum_stock"])).slice(0, 12).map((r) => ({ label: String(r["name"]), value: Number(r["stock"]) }));
}

function Reports() {
  const { can, isDevSession } = useAuth();
  const [tab, setTab] = useState<Tab>("revenue");
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-09-30");
  const q = useQuery({
    queryKey: ["report", tab, from, to, isDevSession], retry: shouldRetryRead, enabled: can(["view_reports", "view_accounting"]),
    queryFn: async () => {
      if (isDevSession) return mockReport(tab, from, to);
      const r = await request<Record<string, unknown>>(endpoints.reports[tab], { query: { start_date: from, end_date: to } });
      const d = r.data ?? {};
      return Object.entries(d).filter(([, v]) => typeof v === "number").map(([label, value]) => ({ label: humanize(label), value: Number(value) }));
    },
  });
  if (!can(["view_reports", "view_accounting"])) return <ForbiddenState />;
  const isMoney = tab === "revenue" || tab === "financial";

  return (
    <div className="space-y-4">
      {isDevSession && <div><MockDataBanner reason="Computed from development records" /></div>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">Reports</h1>
        <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div role="tablist" className="flex overflow-hidden rounded-md border text-sm">
          {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3 py-1.5 capitalize ${tab === t ? "bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>{t}</button>)}
        </div>
        <label className="flex items-center gap-2 text-sm">From <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></label>
        <label className="flex items-center gap-2 text-sm">To <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></label>
      </div>
      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2">
            <h2 className="mb-2 font-display font-bold capitalize text-primary">{tab === "inventory" ? "Low stock items" : `${tab} breakdown`}</h2>
            <div className="h-72"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={q.data}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer></div>
          </section>
          <section className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-2 font-display font-bold text-primary">Summary</h2>
            <table className="w-full text-sm"><tbody>
              {q.data?.map((r) => <tr key={r.label} className="border-b last:border-0"><td className="py-1.5">{r.label}</td><td className="py-1.5 text-right font-medium tabular-nums">{formatValue(r.value, isMoney ? "money" : "text")}</td></tr>)}
              {!q.data?.length && <tr><td className="py-4 text-center text-muted-foreground">No data for this period.</td></tr>}
            </tbody></table>
          </section>
        </div>
      )}
    </div>
  );
}
