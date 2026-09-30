import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/gallery")({
  head: () => seo("Gallery", "Photos of Munab Nursing Home."),
  component: Gallery,
});

function Gallery() {
  const q = useQuery({ queryKey: publicKeys.featured, queryFn: publicService.featured, retry: shouldRetryRead });
  const items = (q.data?.gallery ?? []).map((g) => ({ ...g, src: g.image_url ?? g.image ?? g.url })).filter((g) => g.src);
  return (
    <PublicShell>
      <PageHeader eyebrow="Gallery" title="Inside the clinic." />
      <Container>
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !items.length ? <EmptyState title="No gallery photos published yet" />
          : <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">{items.map((g, i) => (
              <li key={g.id ?? i}><img src={g.src!} alt={g.title ?? "Clinic photo"} loading="lazy" className="aspect-square w-full rounded-lg object-cover" /></li>
            ))}</ul>}
      </Container>
    </PublicShell>
  );
}
