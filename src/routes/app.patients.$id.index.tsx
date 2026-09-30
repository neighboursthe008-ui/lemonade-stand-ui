import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, Pencil, Printer, TriangleAlert, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PatientModuleTab } from "@/components/patients/PatientModuleTab";
import { Odontogram } from "@/components/clinical/Odontogram";
import { Button } from "@/components/ui/button";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
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


function PatientProfile() {
  const { id } = Route.useParams();
  const pid = Number(id);
  const { can, isDevSession } = useAuth();
  const repo = getPatientRepository(isDevSession);
  const nav = useNavigate();
  const [letter, setLetter] = useState<null | "certificate" | "referral">(null);
  const [letterText, setLetterText] = useState("");
  const tabs = ([
    ["appointments", "Appointments", "view_appointments"], ["consultations", "Consultations", "view_consultations"], ["vitals", "Vitals", "view_consultations"],
    ["dental", "Dental chart", "view_dental_chart"], ["treatment-plans", "Treatment plans", "view_consultations"], ["prescriptions", "Prescriptions", "view_prescriptions"],
    ["lab-orders", "Lab", "view_lab_orders"], ["radiology", "Radiology", "view_radiology_orders"], ["invoices", "Invoices", "view_invoices"], ["payments", "Payments", "view_payments"],
  ] as const).filter((t) => can(t[2]));
  const [tab, setTab] = useState<string | undefined>(tabs[0]?.[0]);
  const q = useQuery({ queryKey: ["patient", repo.source, pid], queryFn: () => repo.get(pid), retry: shouldRetryRead, enabled: can("view_patients") });
  const go = (module: string) => nav({ to: "/app/$module", params: { module }, search: { new: 1, patient_id: pid } });
  const actions: [string, string, string | string[], () => void][] = [
    ["Clinical", "Book appointment", "create_appointments", () => go("appointments")],
    ["Clinical", "Collect vitals", "collect_vitals", () => go("vitals")],
    ["Clinical", "Create consultation", "view_consultations", () => go("consultations")],
    ["Clinical", "Create treatment plan", "view_consultations", () => go("treatment-plans")],
    ["Clinical", "Update dental chart", "edit_dental_chart", () => setTab("dental")],
    ["Clinical", "Create prescription", "create_prescriptions", () => go("prescriptions")],
    ["Clinical", "Create lab order", "view_lab_orders", () => go("lab-orders")],
    ["Clinical", "Order radiology", "view_radiology_orders", () => go("radiology")],
    ["Billing", "Create invoice", "create_invoices", () => go("invoices")],
    ["Billing", "Process payment", "create_payments", () => go("payments")],
    ["Billing", "Receipts", "view_payments", () => nav({ to: "/app/$module", params: { module: "receipts" } })],
    ["Documents", "Update care status / details", "edit_patients", () => nav({ to: "/app/patients/$id/edit", params: { id } })],
    ["Documents", "Print patient summary", "view_patients", () => window.print()],
    ["Documents", "Medical certificate", "view_consultations", () => setLetter("certificate")],
    ["Documents", "Referral letter", "view_consultations", () => setLetter("referral")],
    ["Documents", "Download records (JSON)", "view_patients", () => {
      const blob = new Blob([JSON.stringify(q.data, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${q.data?.patient_number ?? "patient"}.json`; a.click(); URL.revokeObjectURL(a.href);
    }],
  ];
  const allowedActions = actions.filter((x) => can(x[2]));

  if (!can("view_patients")) return <ForbiddenState />;
  if (q.isLoading) return <LoadingState />;
  if (q.isError || !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;
  const balance = Number(p.outstanding_balance || 0);

  return (
    <div className="space-y-4">
      {repo.source === "mock" && <MockDataBanner reason={isDevSession ? "Development profile — no clinic session" : "Patients set to mock data"} />}
      <Link to="/app/patients" className="flex w-fit items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" />All patients</Link>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground"><User className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold text-primary">{p.full_name}</h1>
          <p className="text-sm capitalize text-muted-foreground">{p.patient_number} · {p.age != null ? `${p.age} yrs` : "Age unknown"}{p.gender ? ` · ${p.gender}` : ""} · {p.phone}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Active" : "Inactive"}</span>
        {can("edit_patients") && <Button asChild variant="outline" size="sm"><Link to="/app/patients/$id/edit" params={{ id }}><Pencil className="mr-1 h-4 w-4" />Edit</Link></Button>}
        {allowedActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" className="bg-lemon text-lemon-foreground hover:bg-lemon/90">Actions<ChevronDown className="ml-1 h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {["Clinical", "Billing", "Documents"].map((g, gi) => { const items = allowedActions.filter((x) => x[0] === g); return items.length ? <div key={g}>{gi > 0 && <DropdownMenuSeparator />}<DropdownMenuLabel>{g}</DropdownMenuLabel>{items.map((x) => <DropdownMenuItem key={x[1]} onSelect={x[3]}>{x[1]}</DropdownMenuItem>)}</div> : null; })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
            {tabs.map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${tab === k ? "border-lemon font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}>{l}</button>
            ))}
          </div>
          <div className="p-4">{tab === "dental" ? <Odontogram patientId={pid} /> : tab ? <PatientModuleTab key={tab} moduleKey={tab} patientId={pid} /> : null}</div>
        </section>
      )}

      <Dialog open={!!letter} onOpenChange={(o) => !o && setLetter(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{letter === "certificate" ? "Medical certificate" : "Referral letter"}</DialogTitle><DialogDescription>Generated in the browser for printing. Not stored in the clinic system.</DialogDescription></DialogHeader>
          <div className="space-y-2 rounded-md border bg-background p-4 text-sm">
            <p className="font-display font-bold text-primary">Lemonade Dental Clinic · 0757 117 313</p>
            <p>Date: {new Date().toLocaleDateString("en-KE")}</p>
            <p>Patient: <b>{p.full_name}</b> ({p.patient_number}){p.age != null ? `, ${p.age} years` : ""}</p>
            <p>{letter === "certificate" ? "This is to certify that the above-named patient was seen at our clinic and:" : "Kindly see the above-named patient for further management. Reason for referral:"}</p>
            <Textarea rows={4} value={letterText} onChange={(e) => setLetterText(e.target.value)} placeholder={letter === "certificate" ? "e.g. is advised to rest for 2 days" : "e.g. impacted 38, specialist surgical opinion"} aria-label="Letter details" />
            <p className="pt-6">Signed: ______________________</p>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLetter(null)}>Close</Button><Button onClick={() => window.print()} disabled={!letterText.trim()}><Printer className="mr-1 h-4 w-4" />Print</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
