import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { ErrorState, LoadingState } from "@/components/states/States";
import { getDashboardRepository } from "@/repositories/dashboard";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Lemonade Staff" },
    { name: "description", content: "Role-based overview of the clinic day." },
    { property: "og:title", content: "Dashboard — Lemonade Staff" },
    { property: "og:description", content: "Role-based clinic overview." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const repo = getDashboardRepository();
  const role = user?.roles[0] ?? "super_admin";
  const q = useQuery({ queryKey: ["dashboard", role], queryFn: () => repo.forRole(role) });
  const max = Math.max(...(q.data?.appointmentsByDay.map((d) => d.count) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Good day, {user?.name.split(" ")[0]}</h1>
          <p className="text-sm capitalize text-muted-foreground">{role.replace(/_/g, " ")} overview</p>
        </div>
        {repo.source === "mock" && <MockDataBanner reason="Laravel dashboard API not available yet" />}
      </div>
      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {q.data.kpis.map((k) => (
              <div key={k.key} className="rounded-lg border bg-card p-5">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold">{k.value}</p>
                {k.hint && <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>}
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <section className="rounded-lg border bg-card p-5 lg:col-span-3" aria-labelledby="wk">
              <h2 id="wk" className="text-base font-semibold">Appointments this week</h2>
              <div className="mt-6 flex h-40 items-end gap-3">
                {q.data.appointmentsByDay.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-aqua" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.count} appointments`} />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-lg border bg-card p-5 lg:col-span-2" aria-labelledby="act">
              <h2 id="act" className="text-base font-semibold">Recent activity</h2>
              <ul className="mt-4 space-y-3">
                {q.data.activity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm"><span className="w-10 shrink-0 tabular-nums text-muted-foreground">{a.at}</span><span>{a.text}</span></li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
