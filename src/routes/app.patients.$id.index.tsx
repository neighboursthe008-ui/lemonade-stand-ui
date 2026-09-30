import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowLeft, HeartPulse, Pencil, Pill, Stethoscope, TriangleAlert, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
import { shouldRetryRead } from "@/api/client/http";
import { getPatientRepository } from "@/repositories/patients";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/patients/$id/")({
  head: () => ({ meta: [
    { title: "Patient record — Lemonade Staff" },
    { name: "description", content: "Patient details, medical notes and clinical history." },
    { property: "og:title", content: "Patient record — Lemonade Staff" },
    { property: "og:description", content: "Patient details and clinical history." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: PatientProfile,
});

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—");
const Row = ({ k, v }: { k: string; v?: ReactNode }) => (
  <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium text-primary">{v || "—"}</dd></div>
);
const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-xl border bg-card p-4 shadow-sm"><h2 className="mb-2 font-display text-base font-bold text-primary">{title}</h2>{children}</section>
);

type Tab = "consultations" | "prescriptions" | "vitals";

function PatientProfile() {
  const { id } = Route.useParams();
  const pid = Number(id);
  const { can, isDevSession } = useAuth();
  const repo = getPatientRepository(isDevSession);
  const tabs = ([
    ["consultations", "Consultations", Stethoscope, "view_consultations"],
    ["prescriptions", "Prescriptions", Pill, "view_prescriptions"],
    ["vitals", "Vitals", HeartPulse, "view_consultations"],
  ] as const).filter((t) => can(t[3]));
  const [tab, setTab] = useState<Tab | undefined>(tabs[0]?.[0]);

  const q = useQuery({ queryKey: ["patient", repo.source, pid], queryFn: () => repo.get(pid), retry: shouldRetryRead, enabled: can("view_patients") });
  const h = useQuery({
    queryKey: ["patient-history", repo.source, pid, tab],
    queryFn: async () => (tab === "consultations" ? { c: await repo.consultations(pid) } : tab === "prescriptions" ? { r: await repo.prescriptions(pid) } : { v: await repo.vitals(pid) }),
    enabled: !!tab && q.isSuccess, retry: shouldRetryRead,
  });

  if (!can("view_patients")) return <ForbiddenState />;
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;
  const balance = Number(p.outstanding_balance || 0);

  return (
    <div className="space-y-4">
      {repo.source === "mock" && <MockDataBanner reason={isDevSession ? "Development profile — no clinic session" : "Patients set to mock data"} />}
      <Link to="/app/patients" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All patients</Link>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground"><User className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-primary">{p.full_name}</h1>
          <p className="text-sm capitalize text-muted-foreground">{p.patient_number} · {p.age != null ? `${p.age} yrs` : "Age unknown"}{p.gender ? ` · ${p.gender}` : ""} · {p.phone}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Active" : "Inactive"}</span>
        {can("edit_patients") && <Button asChild variant="outline" size="sm"><Link to="/app/patients/$id/edit" params={{ id }}><Pencil className="mr-1 h-4 w-4" />Edit</Link></Button>}
      </div>

      {p.allergies && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"><TriangleAlert className="h-4 w-4" /><b>Allergies:</b> {p.allergies}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Contact">
          <dl><Row k="Phone" v={p.phone} /><Row k="Alternate phone" v={p.alternate_phone} /><Row k="Email" v={p.email} /><Row k="Address" v={p.address} /><Row k="Registered" v={fmt(p.registered_at)} /></dl>
        </Panel>
        <Panel title="Emergency & next of kin">
          <dl>
            <Row k="Emergency contact" v={p.emergency_contact.name && `${p.emergency_contact.name}${p.emergency_contact.relationship ? ` (${p.emergency_contact.relationship})` : ""}`} />
            <Row k="Emergency phone" v={p.emergency_contact.phone} />
            <Row k="Next of kin" v={p.next_of_kin.name && `${p.next_of_kin.name}${p.next_of_kin.relationship ? ` (${p.next_of_kin.relationship})` : ""}`} />
            <Row k="Next of kin phone" v={p.next_of_kin.phone} />
          </dl>
        </Panel>
        <Panel title="Medical & billing">
          <dl>
            <Row k="Blood group" v={p.blood_group} /><Row k="Medical history" v={p.medical_history} /><Row k="Current medications" v={p.current_medications} />
            <Row k="Insurance" v={p.has_insurance ? "Yes" : "No"} />
            {can("view_invoices") && <Row k="Outstanding balance" v={<span className={balance > 0 ? "text-destructive" : ""}>KSh {balance.toLocaleString("en-KE")}</span>} />}
          </dl>
        </Panel>
      </div>

      {tabs.length > 0 && (
        <section className="rounded-xl border bg-card shadow-sm">
          <div role="tablist" className="flex gap-1 overflow-x-auto border-b px-2">
            {tabs.map(([k, l, Icon]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm ${tab === k ? "border-lemon font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}>
                <Icon className="h-4 w-4" />{l}
              </button>
            ))}
          </div>
          <div className="p-4">
            {h.isLoading ? <LoadingState /> : h.isError ? <ErrorState error={h.error} onRetry={() => h.refetch()} /> : h.data && (
              "c" in h.data ? (h.data.c.length ? <ul className="divide-y">{h.data.c.map((c) => (
                <li key={c.id} className="py-3"><div className="flex justify-between gap-2"><b className="text-primary">{c.reason ?? "Consultation"}</b><span className="text-xs text-muted-foreground">{fmt(c.consulted_at)} · <span className="capitalize">{c.status}</span></span></div>
                  {c.clinical_notes && <p className="mt-1 text-sm text-muted-foreground">{c.clinical_notes}</p>}</li>))}</ul> : <EmptyState title="No consultations yet" />)
              : "r" in h.data ? (h.data.r.length ? <ul className="divide-y">{h.data.r.map((r) => (
                <li key={r.id} className="py-3"><p className="text-xs text-muted-foreground">{fmt(r.created_at)} · <span className="capitalize">{r.status}</span></p>
                  <ul className="mt-1 text-sm">{r.items?.map((i) => <li key={i.id}><b className="text-primary">{i.drug_name}</b> — {[i.dosage, i.frequency, i.duration].filter(Boolean).join(", ")}</li>)}</ul></li>))}</ul> : <EmptyState title="No prescriptions yet" />)
              : (h.data.v.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-[11px] uppercase text-muted-foreground"><tr>{["Date", "BP", "Pulse", "Temp °C", "Weight kg", "SpO₂ %"].map((x) => <th key={x} className="py-2">{x}</th>)}</tr></thead>
                  <tbody>{h.data.v.map((v) => <tr key={v.id} className="border-t tabular-nums"><td className="py-2">{fmt(v.created_at)}</td><td>{v.bp ?? "—"}</td><td>{v.pulse ?? "—"}</td><td>{v.temperature ?? "—"}</td><td>{v.weight ?? "—"}</td><td>{v.oxygen_saturation ?? "—"}</td></tr>)}</tbody>
                </table></div> : <EmptyState title="No vitals recorded yet" />)
            )}
          </div>
        </section>
      )}
    </div>
  );
}
