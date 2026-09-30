import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () => seo("Hospital services", "Explore outpatient, specialist, diagnostic and dental services at Munab Nursing Home."),
  component: Services,
});

function Services() {
  const q = useQuery({ queryKey: publicKeys.services, queryFn: publicService.services, retry: shouldRetryRead });
  return (
    <PublicShell>
      <PageHeader eyebrow="Services" title="Care for every stage of your smile." />
      <Container>
        {q.isLoading ? <LoadingState label="Loading services…" /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.data?.length ? <EmptyState title="No services published yet" />
          : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((s) => (
              <li key={s.id}>
                <Link to="/services/$id" params={{ id: String(s.id) }} className="group flex h-full flex-col rounded-lg border bg-card p-6 hover:border-aqua">
                  <Sparkles className="h-5 w-5 text-aqua" aria-hidden />
                  <h2 className="mt-4 text-lg font-semibold">{s.name}</h2>
                  <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm text-muted-foreground group-hover:text-foreground">Details <ArrowRight className="h-4 w-4" /></span>
                </Link>
              </li>
            ))}</ul>}
      </Container>
    </PublicShell>
  );
}
