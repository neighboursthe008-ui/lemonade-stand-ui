import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/states/States";
import { shouldRetryRead } from "@/api/client/http";
import { useAuth } from "@/stores/auth";
import { humanize } from "@/modules/format";
import { CONDITIONS, SURFACES, getDentalChartService, type ToothEntry } from "@/services/clinical/dentalChart.service";

const ADULT = [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]];
const PRIMARY = [[55, 54, 53, 52, 51, 61, 62, 63, 64, 65], [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]];
const COLOR: Record<string, string> = {
  caries: "bg-destructive/80 text-destructive-foreground", filled: "bg-aqua text-primary", missing: "bg-muted text-muted-foreground line-through",
  crown: "bg-lemon text-lemon-foreground", root_canal: "bg-primary text-primary-foreground", fractured: "bg-warning text-foreground",
  implant: "bg-chart-4 text-primary-foreground", extraction_planned: "bg-destructive/40 text-foreground", healthy: "bg-success/20 text-success",
};

/** FDI odontogram. Reads GET /patients/{id}/dental-chart; saves via PUT /patients/{id}/dental-chart/batch. */
export function Odontogram({ patientId }: { patientId: number }) {
  const { isDevSession, can } = useAuth();
  const svc = getDentalChartService(isDevSession);
  const qc = useQueryClient();
  const [set, setSet] = useState<"adult" | "primary">("adult");
  const [tooth, setTooth] = useState<number | null>(null);
  const [condition, setCondition] = useState<string>("caries");
  const [surface, setSurface] = useState<string>("");
  const [notes, setNotes] = useState("");
  const q = useQuery({ queryKey: ["dental-chart", svc.source, patientId], queryFn: () => svc.get(patientId), retry: shouldRetryRead });
  const save = useMutation({
    mutationFn: () => svc.save(patientId, [{ tooth_number: tooth!, condition_type: condition, tooth_surface: surface || null, notes: notes || null }]),
    onSuccess: async (m) => { await qc.invalidateQueries({ queryKey: ["dental-chart"] }); toast.success(m); setNotes(""); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save chart"),
  });
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const byTooth = new Map<number, ToothEntry[]>();
  q.data!.forEach((e) => byTooth.set(e.tooth_number, [...(byTooth.get(e.tooth_number) ?? []), e]));
  const latest = (t: number) => byTooth.get(t)?.[0]?.condition_type;
  const rows = set === "adult" ? ADULT : PRIMARY;
  const editable = can("edit_dental_chart");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex overflow-hidden rounded-md border text-sm">
          {(["adult", "primary"] as const).map((s) => <button key={s} role="tab" aria-selected={set === s} onClick={() => { setSet(s); setTooth(null); }} className={`px-3 py-1.5 ${set === s ? "bg-lemon font-semibold text-lemon-foreground" : "hover:bg-muted"}`}>{s === "adult" ? "Adult (permanent)" : "Primary (child)"}</button>)}
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">{CONDITIONS.map((c) => <span key={c} className={`rounded px-1.5 py-0.5 ${COLOR[c]}`}>{humanize(c)}</span>)}</div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-max space-y-2 rounded-xl border bg-background p-3">
          {rows.map((r, ri) => (
            <div key={ri} className="flex gap-1">
              {r.map((t, i) => {
                const c = latest(t);
                return (
                  <button key={t} aria-pressed={tooth === t} aria-label={`Tooth ${t}${c ? `, ${humanize(c)}` : ""}`} onClick={() => setTooth(t)}
                    className={`grid h-11 w-9 place-items-center rounded-md border text-xs font-semibold transition ${i === r.length / 2 ? "ml-3" : ""} ${c ? COLOR[c] : "bg-card text-primary"} ${tooth === t ? "ring-2 ring-ring ring-offset-1" : ""}`}>{t}</button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tooth && (
        <div className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-2">
          <div>
            <h3 className="font-display font-bold text-primary">Tooth {tooth} — history</h3>
            {byTooth.get(tooth)?.length ? <ul className="mt-2 divide-y text-sm">{byTooth.get(tooth)!.map((e, i) => <li key={e.id ?? i} className="py-1.5"><b>{humanize(e.condition_type)}</b>{e.tooth_surface ? ` · ${e.tooth_surface}` : ""}{e.notes ? ` — ${e.notes}` : ""}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No entries yet.</p>}
          </div>
          {editable ? (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
              <h3 className="font-display font-bold text-primary">Add entry</h3>
              <label className="block text-sm">Condition<select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={condition} onChange={(e) => setCondition(e.target.value)}>{CONDITIONS.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}</select></label>
              <label className="block text-sm">Surface<select className="mt-1 h-9 w-full rounded-md border bg-background px-2" value={surface} onChange={(e) => setSurface(e.target.value)}><option value="">Whole tooth</option>{SURFACES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></label>
              <label className="block text-sm">Notes<Textarea rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
              <Button type="submit" disabled={save.isPending} className="bg-lemon text-lemon-foreground hover:bg-lemon/90">{save.isPending ? "Saving…" : `Save tooth ${tooth}`}</Button>
            </form>
          ) : <p className="text-sm text-muted-foreground">You can view the chart but not edit it.</p>}
        </div>
      )}
    </div>
  );
}
