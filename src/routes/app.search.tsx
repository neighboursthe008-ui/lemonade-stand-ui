import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { useGlobalSearch } from "@/components/search/GlobalSearch";

export const Route = createFileRoute("/app/search")({
  head: () => ({ meta: [
    { title: "Global search — Munab Staff" }, { name: "description", content: "Search across patients, appointments, billing and stock." },
    { property: "og:title", content: "Global search — Munab Staff" }, { property: "og:description", content: "Search the clinic system." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SearchPage,
});

function SearchPage() {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => setQ(text), 300); return () => clearTimeout(t); }, [text]);
  const res = useGlobalSearch(q);
  const groups = [...new Set(res.data?.map((h) => h.group) ?? [])];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold text-primary">Global search</h1>
      <label className="flex items-center gap-2 rounded-xl border bg-card px-4 shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
        <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, phone, invoice number, product…" aria-label="Search everything" className="h-12 border-0 px-0 text-base shadow-none focus-visible:ring-0" />
      </label>
      {q.trim().length < 2 ? <p className="text-sm text-muted-foreground">Type at least 2 characters. Press Ctrl/⌘ + K anywhere to open quick search.</p>
        : res.isLoading ? <LoadingState label="Searching…" /> : res.isError ? <ErrorState error={res.error} onRetry={() => res.refetch()} />
        : !res.data?.length ? <EmptyState title={`No results for “${q}”`} />
        : groups.map((g) => (
          <section key={g} className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-2 font-display font-bold text-primary">{g}</h2>
            <ul className="divide-y">{res.data!.filter((h) => h.group === g).map((h, i) => (
              <li key={i}><Link to={h.to} {...(h.params ? { params: h.params } : {}) as object} className="block py-2 hover:underline"><span className="font-medium text-primary">{h.label}</span>{h.sub && <span className="ml-2 text-xs text-muted-foreground">{h.sub}</span>}</Link></li>
            ))}</ul>
          </section>
        ))}
    </div>
  );
}
