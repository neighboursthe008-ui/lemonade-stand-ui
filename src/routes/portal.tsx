import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { MpesaCheckout } from "@/components/billing/MpesaCheckout";
import { moduleByKey } from "@/modules/registry";
import { formatValue, getValue, statusClass } from "@/modules/format";
import { seo } from "@/lib/seo";
import { getPatientPortalService, type PortalPatient, type PortalSection } from "@/services/patientPortal/portal.service";

export const Route = createFileRoute("/portal")({
  head: () => seo("Patient portal", "View your appointments, prescriptions, results, invoices and orders at Munab Nursing Home."),
  component: Portal,
});

const SECTIONS: [PortalSection | "overview" | "profile", string][] = [
  ["overview", "Dashboard"], ["appointments", "Appointments"], ["vitals", "Vitals"], ["prescriptions", "Prescriptions"], ["lab-orders", "Lab results"],
  ["radiology", "Radiology"], ["invoices", "Invoices"], ["payments", "Payments"], ["orders", "Shop orders"], ["notifications", "Notifications"], ["profile", "Profile"],
];

function Portal() {
  const [me, setMe] = useState<PortalPatient | null>(null);
  return (
    <PublicShell>
      <PageHeader eyebrow="Patient portal" title={me ? `Welcome, ${me.full_name.split(" ")[0]}` : "Sign in to your records"} />
      <Container>
        <p className="mb-4 rounded-md bg-lemon/30 p-3 text-xs"><b>Development portal:</b> the clinic system has no patient-portal API yet. All records shown are fictional development data.</p>
        {me ? <Workspace me={me} onLogout={() => setMe(null)} /> : <Login onLogin={setMe} />}
      </Container>
    </PublicShell>
  );
}

function Login({ onLogin }: { onLogin: (p: PortalPatient) => void }) {
  const [id, setId] = useState("0710137911");
  const [pw, setPw] = useState("");
  const m = useMutation({ mutationFn: () => getPatientPortalService().login(id, pw), onSuccess: onLogin });
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="max-w-md space-y-4 rounded-lg border bg-card p-6">
      <div className="space-y-1.5"><Label htmlFor="pid">Phone, email or patient number</Label><Input id="pid" value={id} onChange={(e) => setId(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="ppw">Password</Label><Input id="ppw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      {m.isError && <p role="alert" className="text-sm text-destructive">{(m.error as Error).message}</p>}
      <Button type="submit" disabled={m.isPending || !id || !pw}>{m.isPending ? "Signing in…" : "Sign in"}</Button>
      <p className="text-xs text-muted-foreground">New patient? Registration happens at reception — call us or <Link to="/appointments" className="underline">book a visit</Link>.</p>
    </form>
  );
}

function Workspace({ me, onLogout }: { me: PortalPatient; onLogout: () => void }) {
  const [tab, setTab] = useState<(typeof SECTIONS)[number][0]>("overview");
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Portal" className="flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map(([k, l]) => <button key={k} aria-current={tab === k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm ${tab === k ? "bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>{l}</button>)}
        <button onClick={onLogout} className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"><LogOut className="h-4 w-4" />Sign out</button>
      </nav>
      <section className="min-w-0 rounded-lg border bg-card p-5">
        {tab === "overview" ? <Overview me={me} go={setTab} /> : tab === "profile" ? <Profile me={me} /> : <Records me={me} section={tab} />}
      </section>
    </div>
  );
}

function Overview({ me, go }: { me: PortalPatient; go: (s: PortalSection) => void }) {
  const svc = getPatientPortalService();
  const cards: [PortalSection, string][] = [["appointments", "Appointments"], ["prescriptions", "Prescriptions"], ["invoices", "Invoices"], ["orders", "Orders"]];
  const q = useQuery({ queryKey: ["portal-overview", me.id], queryFn: async () => Promise.all(cards.map(([k]) => svc.records(me, k))) });
  if (q.isLoading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{me.patient_number} · {me.phone}</p>
      <div className="grid gap-3 sm:grid-cols-4">{cards.map(([k, l], i) => <button key={k} onClick={() => go(k)} className="rounded-lg border p-4 text-left hover:bg-muted"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold">{q.data?.[i]?.length ?? 0}</p></button>)}</div>
      <div className="flex flex-wrap gap-2"><Button asChild><Link to="/appointments">Book a visit</Link></Button><Button asChild variant="outline"><Link to="/shop">Shop</Link></Button><Button asChild variant="outline"><Link to="/testimonials">Share feedback</Link></Button></div>
    </div>
  );
}

function Records({ me, section }: { me: PortalPatient; section: PortalSection }) {
  const svc = getPatientPortalService();
  const qc = useQueryClient();
  const [pay, setPay] = useState<{ amount: number; ref: string } | null>(null);
  const cfg = moduleByKey(section)!;
  const q = useQuery({ queryKey: ["portal", me.id, section], queryFn: () => svc.records(me, section) });
  const cancel = useMutation({ mutationFn: (id: number) => svc.cancelAppointment(id), onSuccess: (m) => { toast.success(m); qc.invalidateQueries({ queryKey: ["portal"] }); }, onError: (e) => toast.error((e as Error).message) });
  const cols = cfg.columns.filter((c) => !c.key.startsWith("patient"));
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState title={`No ${cfg.title.toLowerCase()} yet`} />;
  return (
    <div className="overflow-x-auto">
      <h2 className="mb-3 font-display text-lg font-bold">{cfg.title}</h2>
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c.key} className="py-2 pr-3">{c.label}</th>)}<th className="py-2"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{q.data.map((r) => (
          <tr key={r.id} className="border-t">
            {cols.map((c) => { const v = getValue(r, c.key); return <td key={c.key} className="py-2 pr-3">{c.format === "status" && v != null ? <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusClass(v)}`}>{formatValue(v, "status")}</span> : formatValue(v, c.format)}</td>; })}
            <td className="py-2 text-right">
              {section === "appointments" && ["scheduled", "confirmed"].includes(String(r["status"])) && <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => { if (confirm("Cancel this appointment?")) cancel.mutate(r.id); }}>Cancel</Button>}
              {section === "invoices" && Number(r["balance"] ?? 0) > 0 && <Button size="sm" onClick={() => setPay({ amount: Number(r["balance"]), ref: String(r["invoice_number"]) })}>Pay with M-Pesa</Button>}
              {section === "orders" && r["payment_status"] === "awaiting_payment" && <Button size="sm" onClick={() => setPay({ amount: Number(r["total"]), ref: String(r["order_number"]) })}>Pay</Button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent><DialogHeader><DialogTitle>M-Pesa payment</DialogTitle></DialogHeader>{pay && <MpesaCheckout amount={pay.amount} reference={pay.ref} onClose={() => setPay(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function Profile({ me }: { me: PortalPatient }) {
  const [cur, setCur] = useState(""); const [next, setNext] = useState("");
  const m = useMutation({ mutationFn: () => getPatientPortalService().changePassword(cur, next), onSuccess: (msg) => { toast.success(msg); setCur(""); setNext(""); } });
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <dl className="space-y-2 text-sm">{[["Name", me.full_name], ["Patient no.", me.patient_number], ["Phone", me.phone], ["Email", me.email ?? "—"]].map(([k, v]) => <div key={k} className="flex justify-between border-b py-1.5"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}<p className="pt-2 text-xs text-muted-foreground">To change these details, please contact reception.</p></dl>
      <form noValidate onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-3">
        <h3 className="font-semibold">Change password</h3>
        <div className="space-y-1.5"><Label htmlFor="cp">Current password</Label><Input id="cp" type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="np">New password (8+ characters)</Label><Input id="np" type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        {m.isError && <p role="alert" className="text-sm text-destructive">{(m.error as Error).message}</p>}
        <Button type="submit" disabled={m.isPending}>{m.isPending ? "Saving…" : "Update password"}</Button>
      </form>
    </div>
  );
}
