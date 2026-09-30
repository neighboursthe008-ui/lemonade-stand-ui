import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { PostCard } from "@/components/public/PostCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/states/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () => seo("Blog", "Dental health articles and clinic updates from Lemonade Dental Clinic."),
  component: Blog,
});

function Blog() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => { setQ(input.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [input]);
  const r = useQuery({ queryKey: publicKeys.blog(page, q), queryFn: () => publicService.blogPosts(page, q || undefined), retry: shouldRetryRead, placeholderData: keepPreviousData });
  const meta = r.data?.meta;
  return (
    <PublicShell>
      <PageHeader eyebrow="Blog" title="Tips and stories for healthier smiles." />
      <Container>
        <label htmlFor="blog-q" className="sr-only">Search articles</label>
        <Input id="blog-q" placeholder="Search articles…" value={input} onChange={(e) => setInput(e.target.value)} className="mb-6 max-w-sm" />
        {r.isLoading ? <LoadingState /> : r.isError ? <ErrorState error={r.error} onRetry={() => r.refetch()} />
          : !r.data?.data.length ? <EmptyState title={q ? "No articles match your search" : "No articles yet"} action={q ? <Button variant="outline" onClick={() => setInput("")}>Clear search</Button> : undefined} />
          : <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{r.data.data.map((p) => <PostCard key={p.id} post={p} />)}</ul>
              {meta && meta.last_page > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span>Page {meta.current_page} of {meta.last_page}</span>
                  <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
                </nav>
              )}
            </>}
      </Container>
    </PublicShell>
  );
}
