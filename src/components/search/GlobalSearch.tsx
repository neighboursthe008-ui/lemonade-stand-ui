import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { endpoints } from "@/api/registry";
import { requestRaw } from "@/api/client/http";
import { useAuth } from "@/stores/auth";
import { modules } from "@/modules/registry";
import { mockRows } from "@/modules/service";
import { getValue } from "@/modules/format";
import { mockPatientList } from "@/mocks/patients/MockPatientRepository";

export interface SearchHit { group: string; label: string; sub?: string; to: string; search?: Record<string, unknown>; params?: Record<string, string> }
const RECENT = "lemonade.recentSearches";

/** Live: GET /api/v1/search?q= (server applies permissions). Dev profiles: search development data, filtered by the user's permissions. */
export function useGlobalSearch(q: string) {
  const { isDevSession, can, user } = useAuth();
  return useQuery({
    queryKey: ["global-search", isDevSession, q], enabled: q.trim().length >= 2, staleTime: 30_000,
    queryFn: async ({ signal }): Promise<SearchHit[]> => {
      if (!isDevSession) {
        const r = await requestRaw<{ results?: Record<string, { id: number; title?: string; name?: string; subtitle?: string }[]> }>(endpoints.search, { query: { q }, signal });
        return Object.entries(r.results ?? {}).flatMap(([group, items]) => (items ?? []).map((i) => ({
          group, label: i.title ?? i.name ?? `#${i.id}`, ...(i.subtitle ? { sub: i.subtitle } : {}),
          ...(group.toLowerCase().includes("patient") ? { to: "/app/patients/$id", params: { id: String(i.id) } } : { to: `/app/${group.toLowerCase()}` }),
        })));
      }
      const s = q.toLowerCase();
      const hits: SearchHit[] = [];
      if (can("view_patients")) mockPatientList().filter((p) => `${p.full_name} ${p.phone} ${p.patient_number}`.toLowerCase().includes(s)).slice(0, 5)
        .forEach((p) => hits.push({ group: "Patients", label: p.full_name, sub: `${p.patient_number} · ${p.phone}`, to: "/app/patients/$id", params: { id: String(p.id) } }));
      for (const m of modules) {
        if (m.superAdminOnly ? !user?.is_super_admin : m.permission && !can(m.permission)) continue;
        const first = m.columns[0]!.key, second = m.columns[1]?.key;
        mockRows(m).filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(s))).slice(0, 3)
          .forEach((r) => hits.push({ group: m.title, label: String(getValue(r, first) ?? `#${r.id}`), ...(second ? { sub: String(getValue(r, second) ?? "") } : {}), to: `/app/${m.key}` }));
      }
      return hits.slice(0, 40);
    },
  });
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const nav = useNavigate();
  const res = useGlobalSearch(q);
  useEffect(() => { try { setRecent(JSON.parse(localStorage.getItem(RECENT) ?? "[]")); } catch { setRecent([]); } }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange(!open); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onOpenChange]);

  const go = (h: SearchHit) => {
    const next = [q, ...recent.filter((x) => x !== q)].filter(Boolean).slice(0, 6);
    localStorage.setItem(RECENT, JSON.stringify(next));
    onOpenChange(false); setQ("");
    nav({ to: h.to, ...(h.params ? { params: h.params } : {}) } as never);
  };
  const groups = [...new Set(res.data?.map((h) => h.group) ?? [])];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search patients, appointments, invoices, orders…" value={q} onValueChange={setQ} />
      <CommandList>
        {q.trim().length < 2 ? (
          recent.length ? <CommandGroup heading="Recent searches">{recent.map((r) => <CommandItem key={r} value={`recent ${r}`} onSelect={() => setQ(r)}>{r}</CommandItem>)}</CommandGroup>
            : <p className="p-6 text-center text-sm text-muted-foreground">Type at least 2 characters. Tip: Ctrl/⌘ + K opens search anywhere.</p>
        ) : res.isLoading ? <p className="p-6 text-center text-sm text-muted-foreground">Searching…</p>
          : res.isError ? <p role="alert" className="p-6 text-center text-sm text-destructive">Search failed — clinic server unavailable.</p>
          : <>
            <CommandEmpty>No results for “{q}”.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g} heading={g}>
                {res.data!.filter((h) => h.group === g).map((h, i) => (
                  <CommandItem key={`${g}-${i}`} value={`${g} ${h.label} ${h.sub ?? ""} ${i}`} onSelect={() => go(h)}>
                    <div><p className="font-medium">{h.label}</p>{h.sub && <p className="text-xs text-muted-foreground">{h.sub}</p>}</div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </>}
      </CommandList>
    </CommandDialog>
  );
}
