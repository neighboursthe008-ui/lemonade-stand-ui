import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { ErrorState, LoadingState, NotFoundState } from "@/components/states/States";
import { Button } from "@/components/ui/button";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/services/$id")({
  head: () => seo("Service details", "Details about this Munab Nursing Home service and how to book it."),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  // No single-service endpoint exists; the detail is resolved from the documented list endpoint.
  const q = useQuery({ queryKey: publicKeys.services, queryFn: publicService.services, retry: shouldRetryRead });
  const s = q.data?.find((x) => String(x.id) === id);
  return (
    <PublicShell>
      {q.isLoading ? <Container><LoadingState /></Container> : q.isError ? <Container><ErrorState error={q.error} onRetry={() => q.refetch()} /></Container>
        : !s ? <Container><NotFoundState what="service" /></Container> : (
          <>
            <PageHeader eyebrow="Service" title={s.name}>Speak with one of our dentists about whether this is right for you.</PageHeader>
            <Container className="flex flex-wrap gap-3">
              <Button asChild className="bg-lemon text-lemon-foreground hover:bg-lemon/90"><Link to="/appointments" search={{ service: s.id }}>Book this service</Link></Button>
              <Button asChild variant="outline"><Link to="/services">All services</Link></Button>
            </Container>
          </>
        )}
    </PublicShell>
  );
}
