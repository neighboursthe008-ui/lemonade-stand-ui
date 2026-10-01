import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { CalendarCheck, Phone } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { getPublicRequestService, type SubmitResult } from "@/services/public/requests.service";
import { clinic } from "@/config/clinic";
import { seo } from "@/lib/seo";

const search = z.object({ service: z.coerce.number().int().positive().optional(), doctor: z.coerce.number().int().positive().optional() });

export const Route = createFileRoute("/appointments")({
  validateSearch: (s) => search.parse(s),
  head: () => seo("Book an appointment", "Choose a department, service, clinician and time to book your visit. No payment is needed to book."),
  component: Booking,
});

const today = () => new Date().toISOString().slice(0, 10);

function Booking() {
  const s = Route.useSearch();
  const [service, setService] = useState<number | "">(s.service ?? "");
  const [doctor, setDoctor] = useState<number | "">(s.doctor ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [step, setStep] = useState<"choose" | "details" | "done">("choose");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const services = useQuery({ queryKey: publicKeys.services, queryFn: publicService.services, retry: shouldRetryRead });
  const doctors = useQuery({ queryKey: publicKeys.doctors, queryFn: publicService.doctors, retry: shouldRetryRead });
  const times = useQuery({
    queryKey: publicKeys.times(Number(doctor), date),
    queryFn: () => publicService.availableTimes(Number(doctor), date),
    enabled: !!doctor && !!date,
    retry: shouldRetryRead,
  });

  const svc = services.data?.find((x) => x.id === service);
  const doc = doctors.data?.find((x) => x.id === doctor);
  const sel = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <PublicShell>
      <PageHeader eyebrow="Book a visit" title="Pick a time that suits you.">Booking is free. Any consultation fee is confirmed at the clinic when you check in.</PageHeader>
      <Container className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {step === "choose" && (
            <>
              {(services.isError || doctors.isError) && <ErrorState error={services.error ?? doctors.error} onRetry={() => { services.refetch(); doctors.refetch(); }} />}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="svc">Service *</Label>
                  <select id="svc" className={sel} value={service} onChange={(e) => setService(e.target.value ? Number(e.target.value) : "")} disabled={services.isLoading}>
                    <option value="">{services.isLoading ? "Loading…" : "Choose a service"}</option>
                    {services.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc">Dentist *</Label>
                  <select id="doc" className={sel} value={doctor} onChange={(e) => { setDoctor(e.target.value ? Number(e.target.value) : ""); setTime(""); }} disabled={doctors.isLoading}>
                    <option value="">{doctors.isLoading ? "Loading…" : "Choose a clinician"}</option>
                    {doctors.data?.map((x) => <option key={x.id} value={x.id}>{x.name}{x.specialty ? ` — ${x.specialty}` : ""}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" min={today()} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
                </div>
              </div>
              <fieldset>
                <legend className="text-sm font-medium">Available times</legend>
                <div className="mt-2">
                  {!doctor || !date ? <p className="text-sm text-muted-foreground">Choose a clinician and date to see times.</p>
                    : times.isLoading ? <LoadingState label="Checking availability…" />
                    : times.isError ? <ErrorState error={times.error} onRetry={() => times.refetch()} />
                    : !times.data?.length ? <EmptyState title="No free times on this day">Try another date.</EmptyState>
                    : <div className="flex flex-wrap gap-2">{times.data.map((t) => (
                        <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={`rounded-md border px-3 py-2 text-sm ${time === t ? "border-brand bg-brand text-brand-foreground" : "hover:border-aqua"}`}>{t}</button>
                      ))}</div>}
                </div>
              </fieldset>
              <Button disabled={!service || !doctor || !date || !time} onClick={() => setStep("details")}>Continue</Button>
            </>
          )}
          {step === "details" && <DetailsForm onBack={() => setStep("choose")} onSubmit={async (v) => { const r = await getPublicRequestService().book({ service_id: Number(service), service_name: svc?.name ?? "", clinician_id: Number(doctor), clinician_name: doc?.name ?? "", date, time, guest_name: v.name, guest_phone: v.phone, ...(v.email ? { guest_email: v.email } : {}) }); setResult(r); setStep("done"); }} />}
          {step === "done" && result && (
            <div role="status" className="rounded-lg border border-success/40 bg-success/10 p-6">
              <p className="flex items-center gap-2 text-lg font-semibold"><CalendarCheck className="h-5 w-5 text-success" />Request received — ref {result.reference}</p>
              <p className="mt-2 text-sm">{svc?.name} with {doc?.name} on {date} at {time}.</p>
              {result.development && <p className="mt-3 rounded-md bg-lemon/30 p-3 text-sm"><b>Development booking:</b> {result.message} Call <a className="underline" href={clinic.phoneHref}>{clinic.phone}</a> to confirm a real appointment.</p>}
              <div className="mt-4"><Button variant="outline" onClick={() => { setStep("choose"); setTime(""); setResult(null); }}>Book another visit</Button></div>
            </div>
          )}
        </div>
        <aside className="h-fit rounded-lg border bg-card p-5" aria-label="Your selection">
          <p className="flex items-center gap-2 font-semibold"><CalendarCheck className="h-4 w-4 text-aqua" />Your visit</p>
          <dl className="mt-4 space-y-2 text-sm">
            {[["Service", svc?.name], ["Dentist", doc?.name], ["Date", date], ["Time", time]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v || "—"}</dd></div>
            ))}
          </dl>
          <a href={clinic.phoneHref} className="mt-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Phone className="h-4 w-4" />Prefer to call? {clinic.phone}</a>
        </aside>
      </Container>
    </PublicShell>
  );
}

const details = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^\+?[0-9\s]{9,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
});

function DetailsForm({ onBack, onSubmit }: { onBack: () => void; onSubmit: (v: { name: string; phone: string; email: string }) => Promise<void> }) {
  const [v, setV] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = details.safeParse(v);
    if (!r.success) { setErr(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErr({}); setBusy(true);
    onSubmit(r.data).catch(() => setErr({ name: "Could not send your request. Please try again or call us." })).finally(() => setBusy(false));
  };
  const f = (k: keyof typeof v, label: string, type = "text", req = true) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}{req && " *"}</Label>
      <Input id={k} type={type} value={v[k]} aria-invalid={!!err[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      {err[k] && <p className="text-xs text-destructive">{err[k]}</p>}
    </div>
  );
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h2 className="text-lg font-semibold">Your details</h2>
      <div className="grid gap-4 sm:grid-cols-2">{f("name", "Full name")}{f("phone", "Phone", "tel")}{f("email", "Email", "email", false)}</div>
      <div className="flex gap-3"><Button type="button" variant="outline" onClick={onBack}>Back</Button><Button type="submit" disabled={busy}>{busy ? "Sending…" : "Request appointment"}</Button></div>
    </form>
  );
}
