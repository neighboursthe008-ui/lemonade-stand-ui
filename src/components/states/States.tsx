import { AlertTriangle, FileQuestion, Inbox, Loader2, Lock, WifiOff, ServerCrash, Plug } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/api/client/http";

function Shell({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const LoadingState = ({ label = "Loading…" }: { label?: string }) => (
  <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}
  </div>
);
export const EmptyState = ({ title = "Nothing here yet", children, action }: { title?: string; children?: ReactNode; action?: ReactNode }) =>
  <Shell icon={<Inbox className="h-5 w-5" />} title={title} action={action}>{children}</Shell>;
export const ForbiddenState = () =>
  <Shell icon={<Lock className="h-5 w-5" />} title="You don't have access to this">Your role doesn't include the permission for this area. Ask an administrator if you need it.</Shell>;
export const NotFoundState = ({ what = "record" }: { what?: string }) =>
  <Shell icon={<FileQuestion className="h-5 w-5" />} title={`This ${what} could not be found`}>It may have been removed or belong to another branch.</Shell>;
export const BackendPendingState = ({ feature, children }: { feature: string; children?: ReactNode }) =>
  <Shell icon={<Plug className="h-5 w-5" />} title={`${feature}: backend integration pending`}>{children ?? "The Laravel API for this action does not exist yet. Nothing has been saved."}</Shell>;

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error instanceof ApiError ? error : null;
  if (e?.kind === "forbidden") return <ForbiddenState />;
  if (e?.kind === "not_found") return <NotFoundState />;
  const icon = e?.kind === "network" || e?.kind === "timeout" ? <WifiOff className="h-5 w-5" /> : e?.kind === "server" ? <ServerCrash className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />;
  const title = e?.kind === "network" ? "Clinic server unavailable" : e?.kind === "server" ? "The server had a problem" : e?.kind === "rate_limited" ? "Too many requests" : "Something went wrong";
  return (
    <Shell icon={icon} title={title} action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}>
      {e?.message ?? (error instanceof Error ? error.message : "Unexpected error")}
    </Shell>
  );
}

export function ValidationSummary({ errors }: { errors?: Record<string, string[]> | undefined }) {
  if (!errors || !Object.keys(errors).length) return null;
  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      <p className="font-medium">Please fix the following:</p>
      <ul className="mt-1 list-disc pl-5">{Object.entries(errors).flatMap(([k, v]) => v.map((m) => <li key={k + m}>{m}</li>))}</ul>
    </div>
  );
}
