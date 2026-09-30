import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MockDataBanner } from "@/components/states/MockDataBanner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states/States";
import { shouldRetryRead } from "@/api/client/http";
import { getPatientRepository } from "@/repositories/patients";
import { useAuth } from "@/stores/auth";

export const Route = createFileRoute("/app/patients/")({
  head: () => ({ meta: [
    { title: "Patients — Lemonade Staff" },
    { name: "description", content: "Search, filter and open patient records." },
    { property: "og:title", content: "Patients — Lemonade Staff" },
    { property: "og:description", content: "Patient records for Lemonade Dental staff." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: PatientsPage,
});

const ksh = (s: string) => `KSh ${Number(s || 0).toLocaleString("en-KE")}`;

function PatientsPage() {
  const { can, isDevSession, activeBranchId } = useAuth();
  const repo = getPatientRepository(isDevSession);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setSearch(text); setPage(1); }, 300); return () => clearTimeout(t); }, [text]);

  const q = useQuery({
    queryKey: ["patients", repo.source, { page, search, status, activeBranchId }],
    queryFn: () => repo.list({ page, per_page: 15, search, status, branch_id: activeBranchId }),
    placeholderData: keepPreviousData, retry: shouldRetryRead, enabled: can("view_patients"),
  });
  if (!can("view_patients")) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      {repo.source === "mock" && <MockDataBanner reason={isDevSession ? "Development profile — no clinic session" : "Patients set to mock data"} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Patients</h1>
          <p className="text-sm text-muted-foreground">{q.data ? `${q.data.total.toLocaleString()} patients in this branch` : "Patient records"}</p>
        </div>
        {can("create_patients") && (
          <Button asChild className="bg-lemon text-lemon-foreground hover:bg-lemon/90"><Link to="/app/patients/new"><Plus className="mr-1 h-4 w-4" />Register patient</Link></Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, phone, email or patient number" aria-label="Search patients" className="border-0 px-0 shadow-none focus-visible:ring-0" />
        </label>
        <select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>

      {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : !q.data?.items.length ? (
        <EmptyState title={search || status ? "No patients match your search" : "No patients yet"} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>{["Patient", "Patient no.", "Phone", "Age / Gender", "Balance", "Status"].map((h) => <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {q.data.items.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-2.5">
                      <Link to="/app/patients/$id" params={{ id: String(p.id) }} className="flex items-center gap-2 font-medium text-primary hover:underline">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground"><User className="h-4 w-4" /></span>
                        <span><span className="block">{p.full_name}</span>{p.email && <span className="block text-xs font-normal text-muted-foreground">{p.email}</span>}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{p.patient_number}</td>
                    <td className="px-4 py-2.5 tabular-nums">{p.phone}</td>
                    <td className="px-4 py-2.5 capitalize">{p.age ?? "—"}{p.gender ? ` · ${p.gender}` : ""}</td>
                    <td className={`px-4 py-2.5 tabular-nums ${Number(p.outstanding_balance) > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}`}>{ksh(p.outstanding_balance)}</td>
                    <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
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
    </div>
  );
}
