import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { ErrorState, LoadingState, NotFoundState } from "@/components/states/States";
import { Button } from "@/components/ui/button";
import { publicKeys, publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/doctors/$id")({
  head: () => seo("Dentist profile", "Profile of a Lemonade Dental Clinic dentist and how to book with them."),
  component: DoctorDetail,
});

function DoctorDetail() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: publicKeys.doctors, queryFn: publicService.doctors, retry: shouldRetryRead });
  const d = q.data?.find((x) => String(x.id) === id);
  return (
    <PublicShell>
      {q.isLoading ? <Container><LoadingState /></Container> : q.isError ? <Container><ErrorState error={q.error} onRetry={() => q.refetch()} /></Container>
        : !d ? <Container><NotFoundState what="dentist" /></Container> : (
          <>
            <PageHeader eyebrow={d.specialty ?? "Dentist"} title={d.name} />
            <Container className="flex flex-wrap gap-3">
              <Button asChild className="bg-lemon text-lemon-foreground hover:bg-lemon/90"><Link to="/appointments" search={{ doctor: d.id }}>Book with {d.name}</Link></Button>
              <Button asChild variant="outline"><Link to="/doctors">All dentists</Link></Button>
            </Container>
          </>
        )}
    </PublicShell>
  );
}
