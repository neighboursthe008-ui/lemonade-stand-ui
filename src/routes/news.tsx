import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { PostCard } from "@/components/public/PostCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/news")({
  head: () => seo("Clinic news", "The latest news from Lemonade Dental Clinic."),
  component: News,
});

function News() {
  const q = useQuery({ queryKey: publicKeys.featured, queryFn: publicService.featured, retry: shouldRetryRead });
  return (
    <PublicShell>
      <PageHeader eyebrow="News" title="What's new at the clinic." />
      <Container>
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.data?.news.length ? <EmptyState title="No news yet" />
          : <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{q.data.news.map((p) => <PostCard key={p.id} post={p} />)}</ul>}
      </Container>
    </PublicShell>
  );
}
