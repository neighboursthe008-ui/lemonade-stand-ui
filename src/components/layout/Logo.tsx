import { Link } from "@tanstack/react-router";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Lemonade Dental Clinic home">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lemon font-display text-sm font-bold text-lemon-foreground">L</span>
      <span className={`font-display text-lg font-semibold tracking-tight ${inverted ? "text-sidebar-foreground" : "text-foreground"}`}>
        Lemonade<span className="text-aqua">.</span>
      </span>
    </Link>
  );
}
