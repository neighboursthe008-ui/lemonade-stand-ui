import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/PublicShell";
import { ErrorState, EmptyState, LoadingState } from "@/components/states/States";
import { publicService } from "@/api/public/public.service";
import { shouldRetryRead } from "@/api/client/http";
import { HeroCarousel } from "@/components/public/HeroCarousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lemonade Dental Clinic — Gentle, modern dental care" },
      { name: "description", content: "Explore Lemonade Dental Clinic services and dentists, and book an appointment online." },
      { property: "og:title", content: "Lemonade Dental Clinic" },
      { property: "og:description", content: "Explore our services and dentists, and book an appointment online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const services = useQuery({ queryKey: ["public", "services"], queryFn: publicService.services, retry: shouldRetryRead });
  const doctors = useQuery({ queryKey: ["public", "doctors"], queryFn: publicService.doctors, retry: shouldRetryRead });

  return (
    <PublicShell>
      <section className="relative overflow-hidden bg-brand text-brand-foreground">
        <HeroCarousel />
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6 lg:min-h-[640px]">
          <div className="max-w-xl">
            <p className="mb-4 inline-block rounded-full bg-lemon px-3 py-1 text-xs font-semibold text-lemon-foreground">Lemonade Dental Clinic</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Dental care that feels calm, clear and personal.</h1>
            <p className="mt-5 max-w-lg text-brand-foreground/80">Browse our services, meet the dentists and book a visit. No payment is needed to book — your consultation is handled at the clinic.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="bg-lemon text-lemon-foreground hover:bg-lemon/90" disabled title="Booking arrives in Phase 2"><CalendarCheck className="mr-2 h-4 w-4" />Book appointment (soon)</Button>
              <Button asChild size="lg" variant="outline" className="border-brand-foreground/30 bg-transparent text-brand-foreground hover:bg-brand-foreground/10"><Link to="/auth/login">Staff sign in</Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><Stethoscope className="h-5 w-5 text-aqua" />Services</h2>
        <div className="mt-6">
          {services.isLoading ? <LoadingState label="Loading services…" /> : services.isError ? <ErrorState error={services.error} onRetry={() => services.refetch()} />
            : !services.data?.length ? <EmptyState title="No services published yet" />
            : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.data.map((s) => (
                <li key={s.id} className="rounded-lg border bg-card p-5"><h3 className="font-semibold">{s.name ?? s.title}</h3>{s.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>}</li>
              ))}</ul>}
        </div>
      </section>

      <section className="border-t bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><UserRound className="h-5 w-5 text-aqua" />Our dentists</h2>
          <div className="mt-6">
            {doctors.isLoading ? <LoadingState label="Loading dentists…" /> : doctors.isError ? <ErrorState error={doctors.error} onRetry={() => doctors.refetch()} />
              : !doctors.data?.length ? <EmptyState title="No dentists listed yet" />
              : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{doctors.data.map((d) => (
                  <li key={d.id} className="rounded-lg border bg-card p-5"><h3 className="font-semibold">{d.name}</h3><p className="text-sm text-muted-foreground">{d.specialization ?? d.title ?? "Dentist"}</p></li>
                ))}</ul>}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
