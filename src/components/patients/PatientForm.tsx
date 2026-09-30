import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ValidationSummary } from "@/components/states/States";
import { BLOOD_GROUPS, type Patient, type PatientInput } from "@/types/patient";

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
// Mirrors PatientController::store validation rules.
const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(255),
  middle_name: opt(255),
  last_name: z.string().trim().min(1, "Last name is required").max(255),
  date_of_birth: z.string().optional().refine((v) => !v || new Date(v) < new Date(new Date().toDateString()), "Date of birth must be before today"),
  gender: z.enum(["", "male", "female", "other"]).optional(),
  phone: z.string().trim().min(1, "Phone is required").max(50),
  alternate_phone: opt(50),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  address: opt(500),
  emergency_contact_name: opt(255), emergency_contact_phone: opt(50), emergency_contact_relationship: opt(100),
  next_of_kin_name: opt(255), next_of_kin_phone: opt(50), next_of_kin_relationship: opt(100),
  referral_source: opt(255), notes: opt(5000), allergies: opt(5000), medical_history: opt(5000), current_medications: opt(5000),
  blood_group: z.enum(["", ...BLOOD_GROUPS]).optional(),
  has_insurance: z.boolean().optional(),
  branch_id: z.coerce.number({ invalid_type_error: "Choose a branch" }).refine((n) => n !== 0, "Choose a branch"),
});
type Values = z.infer<typeof schema>;

export function toDefaults(p?: Patient, branchId?: number | null): Values {
  return {
    first_name: p?.first_name ?? "", middle_name: p?.middle_name ?? "", last_name: p?.last_name ?? "",
    date_of_birth: p?.date_of_birth ?? "", gender: p?.gender ?? "", phone: p?.phone ?? "", alternate_phone: p?.alternate_phone ?? "",
    email: p?.email ?? "", address: p?.address ?? "",
    emergency_contact_name: p?.emergency_contact.name ?? "", emergency_contact_phone: p?.emergency_contact.phone ?? "", emergency_contact_relationship: p?.emergency_contact.relationship ?? "",
    next_of_kin_name: p?.next_of_kin.name ?? "", next_of_kin_phone: p?.next_of_kin.phone ?? "", next_of_kin_relationship: p?.next_of_kin.relationship ?? "",
    referral_source: p?.referral_source ?? "", notes: p?.notes ?? "", allergies: p?.allergies ?? "",
    medical_history: p?.medical_history ?? "", current_medications: p?.current_medications ?? "",
    blood_group: (p?.blood_group as Values["blood_group"]) ?? "", has_insurance: p?.has_insurance ?? false,
    branch_id: p?.branch_id ?? branchId ?? 0,
  };
}

const clean = (v: Values): PatientInput => {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v)) out[k] = val === "" ? null : val;
  return out as unknown as PatientInput;
};

function Field({ label, error, children, wide }: { label: string; error?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium text-primary">{label}</span>{children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="rounded-xl border bg-card p-4 shadow-sm">
    <legend className="px-1 font-display text-base font-bold text-primary">{title}</legend>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>
);

export function PatientForm({ initial, branches, onSubmit, submitLabel, serverErrors, onCancel }: {
  initial: Values; branches: { id: number; name: string }[]; submitLabel: string;
  serverErrors?: Record<string, string[]>; onSubmit: (v: PatientInput) => Promise<unknown>; onCancel: () => void;
}) {
  const f = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial });
  const e = f.formState.errors;
  const se = (k: string) => e[k as keyof Values]?.message ?? serverErrors?.[k]?.[0];
  const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <form noValidate onSubmit={f.handleSubmit((v) => onSubmit(clean(v)))} className="space-y-4">
      <ValidationSummary errors={serverErrors} />
      <Section title="Personal details">
        <Field label="First name *" error={se("first_name")}><Input {...f.register("first_name")} autoComplete="given-name" /></Field>
        <Field label="Middle name" error={se("middle_name")}><Input {...f.register("middle_name")} /></Field>
        <Field label="Last name *" error={se("last_name")}><Input {...f.register("last_name")} autoComplete="family-name" /></Field>
        <Field label="Date of birth" error={se("date_of_birth")}><Input type="date" {...f.register("date_of_birth")} /></Field>
        <Field label="Gender" error={se("gender")}>
          <select className={sel} {...f.register("gender")}><option value="">Not specified</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select>
        </Field>
        <Field label="Branch *" error={se("branch_id")}>
          <select className={sel} {...f.register("branch_id")}><option value={0}>Choose a branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </Field>
      </Section>
      <Section title="Contact">
        <Field label="Phone *" error={se("phone")}><Input type="tel" {...f.register("phone")} autoComplete="tel" /></Field>
        <Field label="Alternate phone" error={se("alternate_phone")}><Input type="tel" {...f.register("alternate_phone")} /></Field>
        <Field label="Email" error={se("email")}><Input type="email" {...f.register("email")} autoComplete="email" /></Field>
        <Field label="How did they hear about us?" error={se("referral_source")}><Input {...f.register("referral_source")} /></Field>
        <Field label="Address" error={se("address")} wide><Input {...f.register("address")} /></Field>
      </Section>
      <Section title="Emergency contact & next of kin">
        <Field label="Emergency contact name" error={se("emergency_contact_name")}><Input {...f.register("emergency_contact_name")} /></Field>
        <Field label="Emergency contact phone" error={se("emergency_contact_phone")}><Input type="tel" {...f.register("emergency_contact_phone")} /></Field>
        <Field label="Relationship" error={se("emergency_contact_relationship")}><Input {...f.register("emergency_contact_relationship")} /></Field>
        <Field label="Next of kin name" error={se("next_of_kin_name")}><Input {...f.register("next_of_kin_name")} /></Field>
        <Field label="Next of kin phone" error={se("next_of_kin_phone")}><Input type="tel" {...f.register("next_of_kin_phone")} /></Field>
        <Field label="Next of kin relationship" error={se("next_of_kin_relationship")}><Input {...f.register("next_of_kin_relationship")} /></Field>
      </Section>
      <Section title="Medical">
        <Field label="Blood group" error={se("blood_group")}>
          <select className={sel} {...f.register("blood_group")}><option value="">Unknown</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}</select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" {...f.register("has_insurance")} className="h-4 w-4" />Has insurance</label>
        <Field label="Allergies" error={se("allergies")} wide><Textarea rows={2} {...f.register("allergies")} /></Field>
        <Field label="Medical history" error={se("medical_history")} wide><Textarea rows={2} {...f.register("medical_history")} /></Field>
        <Field label="Current medications" error={se("current_medications")} wide><Textarea rows={2} {...f.register("current_medications")} /></Field>
        <Field label="Notes" error={se("notes")} wide><Textarea rows={2} {...f.register("notes")} /></Field>
      </Section>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={f.formState.isSubmitting} className="bg-lemon text-lemon-foreground hover:bg-lemon/90">{f.formState.isSubmitting ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
