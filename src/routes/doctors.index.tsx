import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/doctors/")({
  head: () => seo("Our doctors", "Meet the doctors, specialists and dentists at Munab Nursing Home."),
  component: Doctors,
});

export const initials = (n: string) => n.replace(/^Dr\.?\s*/i, "").split(/\s+/).map((p) => p[0]).slice(0, 2).join("");

function Doctors() {
  const q = useQuery({ queryKey: publicKeys.doctors, queryFn: publicService.doctors, retry: shouldRetryRead });
  return (
    <PublicShell>
      <PageHeader eyebrow="Our team" title="Doctors & specialists." />
      <Container>
        {q.isLoading ? <LoadingState label="Loading clinicians…" /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.data?.length ? <EmptyState title="No clinicians listed yet" />
          : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((d) => (
              <li key={d.id}>
                <Link to="/doctors/$id" params={{ id: String(d.id) }} className="flex items-center gap-4 rounded-lg border bg-card p-5 hover:border-aqua">
                  <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold">{initials(d.name)}</span>
                  <span><span className="block font-semibold">{d.name}</span><span className="text-sm text-muted-foreground">{d.specialty ?? "Dentist"}</span></span>
                </Link>
              </li>
            ))}</ul>}
      </Container>
    </PublicShell>
  );
}
