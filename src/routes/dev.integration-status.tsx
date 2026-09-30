import { createFileRoute, Link } from "@tanstack/react-router";
import { screenStatuses, backendCapabilities, type IntegrationStatus } from "@/config/backendCapabilities";
import { API_BASE_URL } from "@/config/env";

export const Route = createFileRoute("/dev/integration-status")({
  head: () => ({ meta: [
    { title: "Integration status — Lemonade" },
    { name: "description", content: "Which screens use the live Laravel API and which use development data." },
    { property: "og:title", content: "Integration status — Lemonade" },
    { property: "og:description", content: "Live vs development data per screen." },
    { name: "robots", content: "noindex" },
  ] }),
  component: Status,
});

const tone: Record<IntegrationStatus, string> = {
  LIVE_API: "bg-success/15 text-success", PARTIAL_API: "bg-aqua/20 text-foreground", MOCK: "bg-warning/20 text-foreground", BLOCKED: "bg-destructive/15 text-destructive",
};

function Status() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm text-muted-foreground">← Home</Link>
      <h1 className="mt-2 text-2xl font-semibold">Integration status</h1>
      <p className="mt-1 text-sm text-muted-foreground">API base: <code>{API_BASE_URL}</code></p>
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {Object.entries(backendCapabilities).map(([k, v]) => <span key={k} className="rounded-full border px-2 py-1">{k}: <b>{v}</b></span>)}
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr>{["Screen", "Route", "Endpoint", "Status", "Source", "Known limitation"].map((h) => <th key={h} scope="col" className="px-3 py-2">{h}</th>)}</tr></thead>
          <tbody>{screenStatuses.map((s) => (
            <tr key={s.screen} className="border-t">
              <td className="px-3 py-2 font-medium">{s.screen}</td><td className="px-3 py-2"><code>{s.route}</code></td>
              <td className="px-3 py-2 text-muted-foreground">{s.endpoint}</td>
              <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${tone[s.status]}`}>{s.status}</span></td>
              <td className="px-3 py-2">{s.source}</td><td className="px-3 py-2 text-muted-foreground">{s.limitation ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
