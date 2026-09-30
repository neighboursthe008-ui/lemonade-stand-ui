import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { PostCard } from "@/components/public/PostCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/events")({
  head: () => seo("Events", "Upcoming events and community activities from Lemonade Dental Clinic."),
  component: Events,
});

function Events() {
  const q = useQuery({ queryKey: publicKeys.events, queryFn: publicService.events, retry: shouldRetryRead });
  return (
    <PublicShell>
      <PageHeader eyebrow="Events" title="Clinic events and community days." />
      <Container>
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.data?.length ? <EmptyState title="No events announced yet" />
          : <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{q.data.map((p) => <PostCard key={p.id} post={p} />)}</ul>}
      </Container>
    </PublicShell>
  );
}
