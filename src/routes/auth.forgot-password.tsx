import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/api/auth/auth.service";
import { ApiError } from "@/api/client/http";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [
    { title: "Reset your password — Munab Nursing Home" },
    { name: "description", content: "Request a password reset link for your Munab Nursing Home staff account." },
    { property: "og:title", content: "Reset password — Munab Nursing Home" },
    { property: "og:description", content: "Request a password reset link." },
  ] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const m = useMutation({
    // The backend reveals whether an email exists (400 vs 200). We deliberately show the same message for both.
    mutationFn: async () => { try { await authService.forgotPassword(email); } catch (e) { if (e instanceof ApiError && (e.kind === "network" || e.kind === "rate_limited" || e.kind === "server" || e.kind === "validation")) throw e; } },
  });
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        {m.isSuccess ? (
          <p className="mt-4 text-sm text-muted-foreground">If that email belongs to an account, a reset link has been sent.</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
            {m.isError && <p role="alert" className="text-sm text-destructive">{(m.error as Error).message}</p>}
            <div className="space-y-1.5"><Label htmlFor="email">Email *</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button className="w-full" disabled={m.isPending || !email}>Send reset link</Button>
          </form>
        )}
        <Link to="/auth/login" className="mt-6 block text-sm text-muted-foreground hover:text-foreground">← Back to sign in</Link>
      </div>
    </div>
  );
}
