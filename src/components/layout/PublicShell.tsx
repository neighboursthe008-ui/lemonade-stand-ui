import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <Button asChild size="sm" variant="outline"><Link to="/auth/login">Staff sign in</Link></Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Lemonade Dental Clinic</p>
          <Link to="/dev/integration-status" className="text-brand-foreground/70 hover:text-brand-foreground">Integration status</Link>
        </div>
      </footer>
    </div>
  );
}
