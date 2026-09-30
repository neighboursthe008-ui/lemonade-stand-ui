import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Phone } from "lucide-react";
import { PublicShell } from "@/components/layout/PublicShell";
import { Container, PageHeader } from "@/components/public/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clinic } from "@/config/clinic";
import { seo } from "@/lib/seo";
import { getPublicRequestService, type SubmitResult } from "@/services/public/requests.service";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact us", "Call or message Lemonade Dental Clinic to book or ask a question."),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^(\+?[0-9\s]{9,15})?$/, "Enter a valid phone number"),
  subject: z.string().trim().min(3, "Add a subject").max(150),
  message: z.string().trim().min(10, "Message is too short").max(1000),
});
type V = z.infer<typeof schema>;

function Contact() {
  const [done, setDone] = useState<SubmitResult | null>(null);
  const [fail, setFail] = useState(false);
  const f = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", subject: "", message: "" } });
  const submit = f.handleSubmit(async (v) => {
    setFail(false);
    try { setDone(await getPublicRequestService().contact({ ...v, ...(v.phone ? { phone: v.phone } : {}) })); f.reset(); } catch { setFail(true); }
  });
  const field = (k: keyof V, label: string, type = "text", req = true) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}{req && " *"}</Label>
      {k === "message" ? <Textarea id={k} rows={5} aria-invalid={!!f.formState.errors[k]} {...f.register(k)} /> : <Input id={k} type={type} aria-invalid={!!f.formState.errors[k]} {...f.register(k)} />}
      {f.formState.errors[k] && <p className="text-xs text-destructive">{f.formState.errors[k]?.message}</p>}
    </div>
  );
  return (
    <PublicShell>
      <PageHeader eyebrow="Contact" title="We'd love to hear from you." />
      <Container className="grid gap-8 md:grid-cols-2">
        <div className="h-fit rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Call reception</h2>
          <p className="mt-2 text-sm text-muted-foreground">The quickest way to reach us.</p>
          <Button asChild className="mt-4"><a href={clinic.phoneHref}><Phone className="mr-2 h-4 w-4" />{clinic.phone}</a></Button>
          {clinic.address && <p className="mt-4 text-sm">{clinic.address}</p>}
          {clinic.hours && <p className="mt-1 text-sm text-muted-foreground">{clinic.hours}</p>}
        </div>
        <div className="rounded-lg border bg-card p-6">
          {done ? (
            <div role="status" className="space-y-3">
              <p className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="h-5 w-5 text-success" />Thanks — ref {done.reference}</p>
              {done.development && <p className="rounded-md bg-lemon/30 p-3 text-sm"><b>Development form:</b> {done.message} Please call {clinic.phone} for anything urgent.</p>}
              <Button variant="outline" onClick={() => setDone(null)}>Send another message</Button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="space-y-4">
              <h2 className="text-lg font-semibold">Send a message</h2>
              <div className="grid gap-4 sm:grid-cols-2">{field("name", "Name")}{field("email", "Email", "email")}{field("phone", "Phone", "tel", false)}{field("subject", "Subject")}</div>
              {field("message", "Message")}
              {fail && <p role="alert" className="text-sm text-destructive">Couldn't send. Please try again or call us.</p>}
              <Button type="submit" disabled={f.formState.isSubmitting}>{f.formState.isSubmitting ? "Sending…" : "Send message"}</Button>
            </form>
          )}
        </div>
      </Container>
    </PublicShell>
  );
}
