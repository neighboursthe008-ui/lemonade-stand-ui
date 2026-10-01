import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";
import { specialties, type Specialty } from "@/config/specialties";

export const Route = createFileRoute("/specialties")({
  head: () => seo("Specialties & services", "All specialties and hospital services at Munab Nursing Home — outpatient, emergency, maternity, paediatrics, diagnostics, pharmacy, theatre, dental and specialist clinics."),
  component: Specialties,
});

const GROUPS: Specialty["group"][] = ["Core care", "Diagnostics & support", "Specialist clinics"];

function Specialties() {
  return (
    <PublicShell>
      <PageHeader eyebrow="Hospital services" title="Specialties & services" />
      <Container>
        {GROUPS.map((g) => (
          <section key={g} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">{g}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.filter((s) => s.group === g).map((s) => (
                <li key={s.code} className="rounded-lg border bg-card p-5">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">{s.services.map((x) => <li key={x} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{x}</li>)}</ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <div className="flex flex-wrap gap-3 pb-12">
          <Button asChild><Link to="/appointments">Book an appointment</Link></Button>
          <Button asChild variant="outline"><Link to="/shop">Pharmacy health products</Link></Button>
        </div>
      </Container>
    </PublicShell>
  );
}
