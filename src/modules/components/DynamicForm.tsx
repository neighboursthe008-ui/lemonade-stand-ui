import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPatientRepository } from "@/repositories/patients";
import { useAuth } from "@/stores/auth";
import { DENTISTS } from "../seedKit";
import { humanize } from "../format";
import type { FieldDef } from "../types";

type Values = Record<string, unknown>;

function buildSchema(fields: FieldDef[]) {
  return z.record(z.unknown()).superRefine((v, ctx) => {
    for (const f of fields) {
      if (f.showIf && !f.showIf(v)) continue;
      const raw = v[f.name];
      const empty = raw === undefined || raw === null || raw === "";
      if (f.type === "checkbox") continue;
      if (empty) { if (f.required) ctx.addIssue({ code: "custom", path: [f.name], message: `${f.label} is required` }); continue; }
      const s = String(raw);
      if (f.type === "email" && !z.string().email().safeParse(s).success) ctx.addIssue({ code: "custom", path: [f.name], message: "Enter a valid email" });
      if (["number", "money"].includes(f.type)) {
        const n = Number(s);
        if (!isFinite(n)) ctx.addIssue({ code: "custom", path: [f.name], message: "Enter a number" });
        else if (f.min !== undefined && n < f.min) ctx.addIssue({ code: "custom", path: [f.name], message: `Must be at least ${f.min}` });
      }
      if (s.length > 5000) ctx.addIssue({ code: "custom", path: [f.name], message: "Too long" });
    }
  });
}

/** Converts form strings into typed API values, dropping hidden conditional fields. */
function toPayload(fields: FieldDef[], v: Values) {
  const out: Values = {};
  for (const f of fields) {
    if (f.showIf && !f.showIf(v)) continue;
    const raw = v[f.name];
    if (f.type === "checkbox") { out[f.name] = !!raw; continue; }
    if (raw === "" || raw === undefined) { out[f.name] = null; continue; }
    out[f.name] = ["number", "money", "patient", "dentist"].includes(f.type) ? Number(raw) : f.type === "datetime" ? new Date(String(raw)).toISOString() : raw;
  }
  return out;
}

const toInput = (f: FieldDef, v: unknown) => {
  if (v == null) return f.type === "checkbox" ? false : "";
  if (f.type === "datetime") { const d = new Date(String(v)); return isNaN(+d) ? "" : new Date(+d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); }
  if (f.type === "date") return String(v).slice(0, 10);
  return v;
};

export function DynamicForm({ fields, initial, submitLabel, onSubmit, onCancel, serverErrors, liveSource, validate }: {
  validate?: ((v: Values) => Record<string, string>) | undefined;
  fields: FieldDef[]; initial?: Values | undefined; submitLabel: string; liveSource: boolean;
  onSubmit: (payload: Values) => Promise<void>; onCancel: () => void; serverErrors?: Record<string, string[]> | undefined;
}) {
  const { isDevSession } = useAuth();
  const defaults = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, toInput(f, initial?.[f.name])])), [fields, initial]);
  const form = useForm<Values>({ resolver: zodResolver(buildSchema(fields)), defaultValues: defaults });
  const values = form.watch();
  useEffect(() => { Object.entries(serverErrors ?? {}).forEach(([k, m]) => form.setError(k, { message: m[0] ?? "Invalid value" })); }, [serverErrors, form]);

  const needsPatients = fields.some((f) => f.type === "patient");
  const patients = useQuery({
    queryKey: ["patient-options", isDevSession], enabled: needsPatients,
    queryFn: () => getPatientRepository(isDevSession).list({ per_page: 100, sort: "first_name", direction: "asc" }),
  });
  const sel = "h-9 w-full rounded-md border bg-background px-2 text-sm";

  return (
    <form noValidate onSubmit={form.handleSubmit((v) => { const errs = validate?.(v) ?? {}; const ks = Object.keys(errs); if (ks.length) { ks.forEach((k) => form.setError(k, { message: errs[k] ?? "Invalid" })); return; } return onSubmit(toPayload(fields, v)); })} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.filter((f) => !f.showIf || f.showIf(values)).map((f) => {
          const err = form.formState.errors[f.name]?.message as string | undefined;
          const id = `f-${f.name}`;
          const reg = form.register(f.name);
          let control;
          if (f.type === "textarea") control = <Textarea id={id} rows={3} {...reg} />;
          else if (f.type === "checkbox") control = <input id={id} type="checkbox" className="h-4 w-4" {...reg} />;
          else if (f.type === "select") control = <select id={id} className={sel} {...reg}><option value="">Choose…</option>{f.options?.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}</select>;
          else if (f.type === "patient") control = (
            <select id={id} className={sel} {...reg} disabled={patients.isLoading}>
              <option value="">{patients.isLoading ? "Loading patients…" : patients.isError ? "Could not load patients" : "Choose a patient…"}</option>
              {patients.data?.items.map((p) => <option key={p.id} value={p.id}>{p.full_name} · {p.patient_number}</option>)}
            </select>
          );
          else if (f.type === "dentist") control = (
            <select id={id} className={sel} {...reg}>
              <option value="">{liveSource ? "Unassigned" : "Unassigned"}</option>
              {!liveSource && DENTISTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          );
          else control = <Input id={id} type={f.type === "money" ? "number" : f.type === "datetime" ? "datetime-local" : f.type} step={f.type === "money" ? "0.01" : undefined} {...reg} />;
          return (
            <div key={f.name} className={f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={id} className={`mb-1 block text-sm font-medium text-primary ${f.type === "checkbox" ? "flex items-center gap-2" : ""}`}>
                {f.label}{f.required && <span className="text-destructive" aria-hidden> *</span>}
              </label>
              {control}
              {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
              {err && <p role="alert" className="mt-1 text-xs text-destructive">{err}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="ghost" onClick={() => form.reset(defaults)}>Reset</Button>
        <Button type="submit" disabled={form.formState.isSubmitting} className="bg-lemon text-lemon-foreground hover:bg-lemon/90">{form.formState.isSubmitting ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
