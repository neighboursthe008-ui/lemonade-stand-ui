import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { clinic } from "@/config/clinic";
import { seo } from "@/lib/seo";
import h3 from "@/assets/hero3.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => seo("About us", "Get to know Munab Nursing Home — our clinic, our team and how visits work."),
  component: About,
});

function About() {
  return (
    <PublicShell>
      <PageHeader eyebrow="About" title="A welcoming clinic for the whole family.">Karibu. Here's what to expect when you visit Munab Nursing Home.</PageHeader>
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <img src={h3.url} alt="Munab Nursing Home reception" loading="lazy" className="aspect-[16/10] w-full rounded-xl object-cover" />
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">How a visit works</h2>
          <ol className="space-y-3 text-sm">
            <li><b>1. Book.</b> Choose a service, a dentist and a time. Booking is free — no payment is needed to book.</li>
            <li><b>2. Check in.</b> Our reception team confirms your details when you arrive.</li>
            <li><b>3. Consultation.</b> Any consultation fee is confirmed at the clinic before you're seen.</li>
            <li><b>4. Care plan.</b> Your dentist explains findings and options before any treatment.</li>
          </ol>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild><Link to="/appointments">Book a visit</Link></Button>
            <Button asChild variant="outline"><a href={clinic.phoneHref}>Call {clinic.phone}</a></Button>
          </div>
        </div>
      </Container>
    </PublicShell>
  );
}
