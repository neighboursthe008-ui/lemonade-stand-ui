import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/stores/auth";
import { ApiError } from "@/api/client/http";
import { DEV_PROFILES_ENABLED } from "@/config/env";
import { devProfiles } from "@/mocks/auth/devProfiles";
import { Logo } from "@/components/layout/Logo";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [
    { title: "Staff sign in — Lemonade Dental Clinic" },
    { name: "description", content: "Sign in to the Lemonade Dental Clinic staff workspace." },
    { property: "og:title", content: "Staff sign in — Lemonade" },
    { property: "og:description", content: "Staff workspace sign in." },
  ] }),
  component: LoginPage,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(1, "Password is required") });

function LoginPage() {
  const { login, loginAsDevProfile } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (v) => {
    setServerError(null);
    try {
      await login(v.email, v.password);
      navigate({ to: "/app/dashboard" });
    } catch (e) {
      const err = e instanceof ApiError ? e : null;
      if (err?.kind === "validation" && err.errors) Object.entries(err.errors).forEach(([k, m]) => form.setError(k as "email", { message: m[0] ?? "Invalid value" }));
      setServerError(err?.kind === "rate_limited" ? `Too many attempts. Wait ${err.retryAfter ?? 60} seconds and try again.` : err?.message ?? "Sign in failed");
    }
  });

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="aurora hidden flex-col justify-between p-10 text-brand-foreground md:flex">
        <Logo inverted />
        <p className="max-w-sm font-display text-2xl">One workspace for every chair, queue and invoice.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold">Staff sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use your Lemonade account.</p>
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {serverError && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{serverError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span aria-hidden className="text-destructive">*</span></Label>
              <Input id="email" type="email" autoComplete="email" aria-invalid={!!form.formState.errors.email} {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><Label htmlFor="password">Password <span aria-hidden className="text-destructive">*</span></Label>
                <Link to="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link></div>
              <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!form.formState.errors.password} {...form.register("password")} />
              {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in
            </Button>
          </form>

          {DEV_PROFILES_ENABLED && (
            <div className="mt-8 rounded-lg border border-dashed p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Development profiles</p>
              <p className="mt-1 text-xs text-muted-foreground">Explore role-based screens without the Laravel server. Uses mock data only.</p>
              <div className="mt-3 grid gap-2">
                {devProfiles.map((p) => (
                  <Button key={p.id} variant="secondary" size="sm" className="justify-start" onClick={() => { loginAsDevProfile(p.id); navigate({ to: "/app/dashboard" }); }}>
                    {p.name} · <span className="ml-1 text-muted-foreground">{(p.roles[0] ?? "").replace(/_/g, " ")}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
