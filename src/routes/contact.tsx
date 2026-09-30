import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { BackendPendingState } from "@/components/states/States";
import { Button } from "@/components/ui/button";
import { clinic } from "@/config/clinic";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact us", "Call Lemonade Dental Clinic to book or ask a question."),
  component: Contact,
});

function Contact() {
  return (
    <PublicShell>
      <PageHeader eyebrow="Contact" title="We'd love to hear from you." />
      <Container className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Call reception</h2>
          <p className="mt-2 text-sm text-muted-foreground">The quickest way to reach us.</p>
          <Button asChild className="mt-4"><a href={clinic.phoneHref}><Phone className="mr-2 h-4 w-4" />{clinic.phone}</a></Button>
          {clinic.address && <p className="mt-4 text-sm">{clinic.address}</p>}
          {clinic.hours && <p className="mt-1 text-sm text-muted-foreground">{clinic.hours}</p>}
        </div>
        <BackendPendingState feature="Contact form">
          Online messages can't be sent from this website yet — the clinic system only accepts them from its own pages. Please call us instead.
        </BackendPendingState>
      </Container>
    </PublicShell>
  );
}
