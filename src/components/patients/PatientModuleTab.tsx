import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { shouldRetryRead } from "@/api/client/http";
import { useAuth } from "@/stores/auth";
import { moduleByKey } from "@/modules/registry";
import { getService } from "@/modules/service";
import { formatValue, getValue, statusClass } from "@/modules/format";

/** Any module's records for one patient — same service layer as the module page. */
export function PatientModuleTab({ moduleKey, patientId }: { moduleKey: string; patientId: number }) {
  const cfg = moduleByKey(moduleKey)!;
  const { isDevSession, can } = useAuth();
  const svc = getService(cfg, isDevSession);
  const q = useQuery({ queryKey: ["module", cfg.key, svc.source, "patient", patientId], queryFn: () => svc.list({ page: 1, perPage: 50, patientId }), retry: shouldRetryRead });
  const cols = cfg.columns.filter((c) => !c.key.startsWith("patient"));
  const canCreate = cfg.canCreate !== false && cfg.fields.length > 0 && (!cfg.managePermission || can(cfg.managePermission));
  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/app/$module" params={{ module: cfg.key }}>Open {cfg.title}</Link></Button>
        {canCreate && <Button asChild size="sm" className="bg-lemon text-lemon-foreground hover:bg-lemon/90"><Link to="/app/$module" params={{ module: cfg.key }} search={{ new: 1, patient_id: patientId }}><Plus className="mr-1 h-4 w-4" />New {cfg.singular.toLowerCase()}</Link></Button>}
      </div>
      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? <EmptyState title={`No ${cfg.title.toLowerCase()} for this patient`} /> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase text-muted-foreground"><tr>{cols.map((c) => <th key={c.key} className="py-2 pr-3">{c.label}</th>)}</tr></thead>
          <tbody>{q.data.items.map((r) => <tr key={r.id} className="border-t">{cols.map((c) => { const v = getValue(r, c.key); return <td key={c.key} className="py-2 pr-3">{c.format === "status" && v != null ? <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusClass(v)}`}>{formatValue(v, "status")}</span> : formatValue(v, c.format)}</td>; })}</tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
}
