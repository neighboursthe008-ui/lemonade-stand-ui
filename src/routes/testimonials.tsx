import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Quote } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/testimonials")({
  head: () => seo("Testimonials", "What patients say about Munab Nursing Home."),
  component: Testimonials,
});

function Testimonials() {
  const q = useQuery({ queryKey: publicKeys.featured, queryFn: publicService.featured, retry: shouldRetryRead });
  return (
    <PublicShell>
      <PageHeader eyebrow="Testimonials" title="In our patients' words." />
      <Container>
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.data?.testimonials.length ? <EmptyState title="No testimonials published yet" />
          : <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{q.data.testimonials.map((t, i) => (
              <li key={t.id ?? i} className="rounded-lg border bg-card p-6">
                <Quote className="h-5 w-5 text-lemon" aria-hidden />
                <p className="mt-3 text-sm">{t.content ?? t.message}</p>
                <p className="mt-4 text-sm font-semibold">{t.name ?? t.author}</p>
              </li>
            ))}</ul>}
      </Container>
    </PublicShell>
  );
}
