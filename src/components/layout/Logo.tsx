import { Link } from "@tanstack/react-router";
import { clinic } from "@/config/clinic";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${clinic.name} home`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-lemon font-display text-sm font-bold text-lemon-foreground">M</span>
      <span className={`leading-tight ${inverted ? "text-sidebar-foreground" : "text-foreground"}`}>
        <span className="block font-display text-base font-semibold tracking-tight">Munab</span>
        <span className={`block text-[10px] uppercase tracking-[0.18em] ${inverted ? "text-sidebar-foreground/70" : "text-muted-foreground"}`}>Nursing Home</span>
      </span>
    </Link>
  );
}
