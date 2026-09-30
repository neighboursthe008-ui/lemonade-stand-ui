import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader, SafeText, formatDate } from "@/components/public/PageHeader";
import { ErrorState, LoadingState } from "@/components/states/States";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  head: () => seo("Article", "An article from the Munab Nursing Home blog."),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const q = useQuery({ queryKey: publicKeys.post(slug), queryFn: () => publicService.blogPost(slug), retry: shouldRetryRead });
  const p = q.data;
  const body = p?.content ?? p?.body ?? p?.excerpt ?? "";
  return (
    <PublicShell>
      {q.isLoading ? <Container><LoadingState /></Container> : q.isError || !p ? <Container><ErrorState error={q.error} onRetry={() => q.refetch()} /></Container> : (
        <>
          <PageHeader eyebrow={p.category ?? "Article"} title={p.title}>{formatDate(p.published_at)}</PageHeader>
          <Container className="max-w-3xl">
            {p.featured_image && <img src={p.featured_image} alt="" className="mb-8 aspect-[16/9] w-full rounded-xl object-cover" />}
            <article className="text-base text-foreground/90"><SafeText text={body} /></article>
            <Link to="/blog" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">← All articles</Link>
          </Container>
        </>
      )}
    </PublicShell>
  );
}
