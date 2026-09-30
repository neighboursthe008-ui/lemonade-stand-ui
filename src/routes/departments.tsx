import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, Bone, FlaskConical, HeartPulse, Microscope, Pill, Scan, Siren, Smile, Stethoscope, Salad, BedDouble } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/departments")({
  head: () => seo("Departments", "Outpatient, emergency, maternity, paediatrics, laboratory, radiology, pharmacy, theatre, inpatient, physiotherapy, nutrition and dental care at Munab Nursing Home."),
  component: Departments,
});

const DEPTS = [
  { icon: Stethoscope, name: "Outpatient (OPD)", text: "General and specialist consultations, walk-in or by appointment." },
  { icon: Siren, name: "Emergency", text: "Emergency assessment and care, with triage on arrival." },
  { icon: Baby, name: "Maternity", text: "Antenatal visits, delivery and postnatal care for mother and baby." },
  { icon: HeartPulse, name: "Paediatrics", text: "Care for babies, children and adolescents, including growth checks." },
  { icon: BedDouble, name: "Inpatient & Nursing", text: "Ward admission with round-the-clock nursing care." },
  { icon: Bone, name: "Theatre", text: "Scheduled and emergency procedures with recovery care." },
  { icon: Microscope, name: "Laboratory", text: "Sample collection and laboratory tests with results to your clinician." },
  { icon: Scan, name: "Radiology", text: "Imaging requested by your clinician. Available studies depend on hospital equipment." },
  { icon: Pill, name: "Pharmacy", text: "Prescriptions checked by a pharmacist and dispensed on site." },
  { icon: FlaskConical, name: "Physiotherapy", text: "Rehabilitation and mobility sessions." },
  { icon: Salad, name: "Nutrition", text: "Dietary assessment and nutrition advice." },
  { icon: Smile, name: "Dental & Oral Health", text: "The full dental service you already know — check-ups, fillings, extractions, root canals and more." },
];

function Departments() {
  return (
    <PublicShell>
      <PageHeader eyebrow="Departments" title="Care across every stage of life.">Munab Nursing Home brings outpatient, inpatient, diagnostic and specialist care together under one roof.</PageHeader>
      <Container>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPTS.map((d) => (
            <li key={d.name} className="rounded-lg border bg-card p-5 shadow-sm">
              <d.icon className="h-6 w-6 text-aqua" aria-hidden />
              <h2 className="mt-3 font-semibold">{d.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild className="bg-lemon text-lemon-foreground hover:bg-lemon/90"><Link to="/appointments">Book an appointment</Link></Button>
          <Button asChild variant="outline"><Link to="/services">See services</Link></Button>
        </div>
      </Container>
    </PublicShell>
  );
}
