import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gavel } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader, formatDate } from "@/components/public/PageHeader";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/States";
import { moduleByKey } from "@/modules/registry";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tenders")({
  head: () => seo("Tenders", "Open and recent public tenders from Munab Nursing Home, with reference numbers, closing dates and submission instructions."),
  component: Tenders,
});

const PUBLIC_STATUSES = ["published", "open", "closed", "awarded"];
/** Only public fields leave this function — never evaluation data. */
function publicTenders() {
  const m = moduleByKey("tenders");
  if (!m) return [];
  return Array.from({ length: m.seedCount }, (_, i) => m.seed(i))
    .filter((t) => PUBLIC_STATUSES.includes(String(t["status"])))
    .map((t) => ({ reference: String(t["reference"]), title: String(t["title"]), department: String(t["department"]), category: String(t["category"]), description: String(t["description"]), eligibility: String(t["eligibility"] ?? ""), submission: String(t["submission"] ?? ""), opening: String(t["opening_date"]), closing: String(t["closing_date"]), contact: String(t["contact"] ?? ""), status: String(t["status"]) }));
}

function Tenders() {
  const [q, setQ] = useState("");
  const all = useMemo(publicTenders, []);
  const list = all.filter((t) => `${t.title} ${t.reference} ${t.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <PublicShell>
      <PageHeader eyebrow="Procurement" title="Public tenders">Tender notices from Munab Nursing Home. Read the full instructions before submitting.</PageHeader>
      <Container>
        <p role="note" className="mb-4 rounded-md border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Development data — these are sample notices, not real tenders. Live notices will appear once the hospital system publishes them.</p>
        <label className="block max-w-sm"><span className="sr-only">Search tenders</span><Input placeholder="Search by title, reference or category" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {list.length === 0 ? <div className="mt-6"><EmptyState title="No tenders match your search" /></div> : (
          <ul className="mt-6 space-y-4">
            {list.map((t) => (
              <li key={t.reference} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t.reference} · {t.department} · {t.category}</p>
                    <h2 className="mt-1 flex items-center gap-2 font-semibold"><Gavel className="h-4 w-4 text-aqua" aria-hidden />{t.title}</h2>
                  </div>
                  <span className="rounded-full border px-2.5 py-0.5 text-xs capitalize">{t.status}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Opens</dt><dd>{formatDate(t.opening)}</dd></div>
                  <div><dt className="text-muted-foreground">Closes</dt><dd className="font-medium">{formatDate(t.closing)}</dd></div>
                  <div><dt className="text-muted-foreground">Eligibility</dt><dd>{t.eligibility}</dd></div>
                  <div><dt className="text-muted-foreground">How to submit</dt><dd>{t.submission}</dd></div>
                  {t.contact && <div><dt className="text-muted-foreground">Contact</dt><dd>{t.contact}</dd></div>}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </PublicShell>
  );
}
