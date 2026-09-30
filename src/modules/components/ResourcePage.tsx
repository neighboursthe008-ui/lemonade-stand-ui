import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, MoreHorizontal, Pencil, Plus, Printer, Search, Trash2, TriangleAlert, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
import { ApiError, shouldRetryRead } from "@/api/client/http";
import { useAuth } from "@/stores/auth";
import { getService } from "../service";
import { formatValue, getValue, humanize, statusClass } from "../format";
import { DynamicForm } from "./DynamicForm";
import type { ActionDef, ModuleConfig, Row } from "../types";

type Modal = { kind: "create"; initial?: Record<string, unknown> | undefined } | { kind: "edit"; row: Row } | { kind: "view"; row: Row } | { kind: "action"; row: Row; action: ActionDef } | { kind: "delete"; row: Row } | null;

function errText(e: unknown) {
  if (e instanceof ApiError) {
    if (e.kind === "forbidden") return "You don't have permission to do this.";
    if (e.kind === "network" || e.kind === "timeout") return "Clinic server unavailable. Please try again.";
    if (e.kind === "conflict") return e.message || "This conflicts with another record (e.g. double booking).";
    if (e.kind === "rate_limited") return "Too many requests — wait a moment and retry.";
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export function ResourcePage({ cfg, openCreate, presetPatientId, onCreateHandled }: { cfg: ModuleConfig; openCreate?: boolean; presetPatientId?: number; onCreateHandled?: () => void }) {
  const { can, user, isDevSession } = useAuth();
  const svc = getService(cfg, isDevSession);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>();

  const allowed = cfg.superAdminOnly ? !!user?.is_super_admin : !cfg.permission || can(cfg.permission);
  const canManage = cfg.superAdminOnly ? !!user?.is_super_admin : !cfg.managePermission || can(cfg.managePermission);

  useEffect(() => { setText(""); setSearch(""); setFilters({}); setPage(1); setModal(null); }, [cfg.key]);
  useEffect(() => { const t = setTimeout(() => { setSearch(text); setPage(1); }, 300); return () => clearTimeout(t); }, [text]);
  useEffect(() => { if (openCreate && canManage && cfg.canCreate !== false && cfg.fields.length) { setModal({ kind: "create", initial: presetPatientId ? { patient_id: presetPatientId } : undefined }); onCreateHandled?.(); } }, [openCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = ["module", cfg.key, svc.source];
  const q = useQuery({
    queryKey: [...key, { page, search, filters }], enabled: allowed, retry: shouldRetryRead, placeholderData: keepPreviousData,
    queryFn: ({ signal: _s }) => svc.list({ page, perPage: 15, search, filters }),
  });
  const done = async (msg: string) => { await qc.invalidateQueries({ queryKey: ["module", cfg.key] }); toast.success(msg); setModal(null); setServerErrors(undefined); };
  const fail = (e: unknown) => { if (e instanceof ApiError && e.kind === "validation") { setServerErrors(e.errors); toast.error("Please fix the highlighted fields"); } else toast.error(errText(e)); };

  const del = useMutation({ mutationFn: (id: number) => svc.remove(id), onSuccess: (r) => done(r.message), onError: fail });
  const act = useMutation({ mutationFn: (p: { id: number; key: string; payload: Record<string, unknown> }) => svc.action(p.id, p.key, p.payload), onSuccess: (r) => done(r.message), onError: fail });
  const pageAct = useMutation({ mutationFn: (k: string) => svc.pageAction(k), onSuccess: (r) => done(r.message), onError: fail });

  if (!allowed) return <ForbiddenState />;

  const editable = (r: Row) => !cfg.appendOnly && canManage && (typeof cfg.canEdit === "function" ? cfg.canEdit(r) : cfg.canEdit !== false) && cfg.fields.length > 0;
  const deletable = !cfg.appendOnly && canManage && !!cfg.canDelete;
  const rowActions = (r: Row) => (cfg.actions ?? []).filter((a) => (!a.when || a.when(r)) && (a.view || (a.permission ? can(a.permission) : canManage)));
  const runAction = (row: Row, a: ActionDef) => {
    if (a.view) return setModal({ kind: "view", row });
    if (a.fields?.length || a.confirm) return setModal({ kind: "action", row, action: a });
    act.mutate({ id: row.id, key: a.key, payload: {} });
  };

  return (
    <div className="space-y-4">
      {svc.source === "mock" && <div><MockDataBanner reason={cfg.backendNote ?? (isDevSession ? "Development profile — no clinic session" : "Development data")} /></div>}
      {cfg.workflowNote && (
        <div role="note" className="flex items-start gap-2 rounded-xl border border-lemon bg-lemon/15 p-3 text-sm text-lemon-foreground"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{cfg.workflowNote}</div>
      )}
      {cfg.appendOnly && <div className="flex items-center gap-2 rounded-xl border bg-accent/40 p-3 text-sm text-primary"><Info className="h-4 w-4" />Payments are append-only. Completed payments can't be edited or deleted — use a refund to correct them.</div>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-primary"><cfg.icon className="h-6 w-6" />{cfg.title}</h1>
          <p className="text-sm text-muted-foreground">{cfg.description}{q.data ? ` · ${q.data.total.toLocaleString()} records` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cfg.pageActions?.filter((a) => !a.permission || can(a.permission)).map((a) => (
            <Button key={a.key} variant="outline" disabled={pageAct.isPending} onClick={() => pageAct.mutate(a.key)}>{pageAct.isPending ? "Working…" : a.label}</Button>
          ))}
          {canManage && cfg.canCreate !== false && cfg.fields.length > 0 && (
            <Button className="bg-lemon text-lemon-foreground hover:bg-lemon/90" onClick={() => setModal({ kind: "create" })}><Plus className="mr-1 h-4 w-4" />New {cfg.singular.toLowerCase()}</Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Search ${cfg.title.toLowerCase()}`} aria-label={`Search ${cfg.title}`} className="border-0 px-0 shadow-none focus-visible:ring-0" />
        </label>
        {cfg.filters?.map((f) => (
          <select key={f.key} aria-label={f.label} value={filters[f.key] ?? ""} onChange={(e) => { setFilters((p) => ({ ...p, [f.key]: e.target.value })); setPage(1); }} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">All {f.label.toLowerCase()}</option>{f.options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
          </select>
        ))}
      </div>

      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? (
        <EmptyState title={search || Object.values(filters).some(Boolean) ? "No results match your search" : `No ${cfg.title.toLowerCase()} yet`} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>{cfg.columns.map((c) => <th key={c.key} scope="col" className={`px-4 py-2.5 text-left font-semibold ${c.hideOnMobile ? "hidden md:table-cell" : ""}`}>{c.label}</th>)}<th scope="col" className="px-4 py-2.5 text-right font-semibold">Actions</th></tr>
              </thead>
              <tbody>
                {q.data.items.map((r) => {
                  const acts = rowActions(r);
                  return (
                    <tr key={r.id} className="border-t hover:bg-muted/40">
                      {cfg.columns.map((c) => {
                        const v = getValue(r, c.key);
                        return (
                          <td key={c.key} className={`px-4 py-2.5 ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.format === "money" ? "tabular-nums" : ""}`}>
                            {c.format === "status" && v != null ? <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass(v)}`}>{formatValue(v, "status")}</span> : <span className="line-clamp-2">{formatValue(v, c.format)}</span>}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <Button variant="ghost" size="icon" aria-label="View" onClick={() => setModal({ kind: "view", row: r })}><Eye className="h-4 w-4" /></Button>
                        {editable(r) && <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setModal({ kind: "edit", row: r })}><Pencil className="h-4 w-4" /></Button>}
                        {(acts.length > 0 || deletable) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {acts.map((a) => <DropdownMenuItem key={a.key} onSelect={() => runAction(r, a)} className={a.danger ? "text-destructive" : ""}>{a.label}</DropdownMenuItem>)}
                              {deletable && <>{acts.length > 0 && <DropdownMenuSeparator />}<DropdownMenuItem onSelect={() => setModal({ kind: "delete", row: r })} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Page {q.data.page} of {q.data.lastPage}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= q.data.lastPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modal?.kind === "create" || modal?.kind === "edit"} onOpenChange={(o) => { if (!o) { setModal(null); setServerErrors(undefined); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modal?.kind === "edit" ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`}</DialogTitle>
            <DialogDescription>{svc.source === "mock" ? "Development data — this will not be sent to the clinic system." : "Saved to the clinic system."}</DialogDescription>
          </DialogHeader>
          {(modal?.kind === "create" || modal?.kind === "edit") && (
            <DynamicForm
              validate={cfg.validate}
              key={modal.kind === "edit" ? modal.row.id : "new"} fields={cfg.fields} liveSource={svc.source === "api"}
              initial={modal.kind === "edit" ? modal.row : modal.initial} serverErrors={serverErrors}
              submitLabel={modal.kind === "edit" ? "Save changes" : `Create ${cfg.singular.toLowerCase()}`}
              onCancel={() => setModal(null)}
              onSubmit={async (payload) => {
                const withBranch = { branch_id: user?.branch_id ?? undefined, ...payload };
                try { const r = modal.kind === "edit" ? await svc.update(modal.row.id, withBranch) : await svc.create(withBranch); await done(r.message); } catch (e) { fail(e); }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modal?.kind === "action" && !!modal.action.fields?.length} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          {modal?.kind === "action" && <>
            <DialogHeader><DialogTitle>{modal.action.label}</DialogTitle><DialogDescription>{modal.action.mockOnly ?? modal.action.confirm ?? `${cfg.singular} #${modal.row.id}`}</DialogDescription></DialogHeader>
            <DynamicForm fields={modal.action.fields ?? []} liveSource={svc.source === "api"} submitLabel={modal.action.label} serverErrors={serverErrors} onCancel={() => setModal(null)}
              onSubmit={async (payload) => { await act.mutateAsync({ id: modal.row.id, key: modal.action.key, payload }).catch(() => undefined); }} />
          </>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={(modal?.kind === "action" && !modal.action.fields?.length) || modal?.kind === "delete"} onOpenChange={(o) => !o && setModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modal?.kind === "delete" ? `Delete this ${cfg.singular.toLowerCase()}?` : modal?.kind === "action" ? modal.action.label : ""}</AlertDialogTitle>
            <AlertDialogDescription>{modal?.kind === "delete" ? "This cannot be undone." : modal?.kind === "action" ? (modal.action.confirm ?? "Continue?") + (modal.action.mockOnly ? ` ${modal.action.mockOnly}` : "") : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={modal?.kind === "delete" || (modal?.kind === "action" && modal.action.danger) ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => { if (modal?.kind === "delete") del.mutate(modal.row.id); else if (modal?.kind === "action") act.mutate({ id: modal.row.id, key: modal.action.key, payload: {} }); }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={modal?.kind === "view"} onOpenChange={(o) => !o && setModal(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {modal?.kind === "view" && <>
            <SheetHeader><SheetTitle>{cfg.singular} #{modal.row.id}</SheetTitle><SheetDescription>{svc.source === "mock" ? "Development data" : "From the clinic system"}</SheetDescription></SheetHeader>
            <dl className="mt-4 divide-y text-sm print:text-black">
              {Object.entries(modal.row).filter(([k, v]) => !k.endsWith("_id") && k !== "id" && v !== undefined && typeof v !== "function").map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{humanize(k)}</dt><dd className="text-right font-medium text-primary">{formatValue(v, /(_at|date|_on)$/.test(k) ? "datetime" : /amount|total|balance|price|cost|revenue/.test(k) ? "money" : typeof v === "boolean" ? "bool" : "text")}</dd></div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Print</Button>
              {editable(modal.row) && <Button variant="outline" onClick={() => setModal({ kind: "edit", row: modal.row })}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}
              {rowActions(modal.row).filter((a) => !a.view).map((a) => <Button key={a.key} variant={a.danger ? "destructive" : "secondary"} size="sm" onClick={() => runAction(modal.row, a)}>{a.label}</Button>)}
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
