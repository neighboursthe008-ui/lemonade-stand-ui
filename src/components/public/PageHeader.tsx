import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <section className="aurora text-brand-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-lemon">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-brand-foreground/80">{children}</div>}
      </div>
    </section>
  );
}

export const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) =>
  <div className={`mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16 ${className}`}>{children}</div>;

/** Render plain text safely (no HTML injection): strips tags, keeps paragraphs. */
export function SafeText({ text }: { text: string }) {
  const clean = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return <>{clean.split(/\n{2,}/).map((p, i) => p.trim() && <p key={i} className="mb-4 leading-relaxed">{p.trim()}</p>)}</>;
}

export const formatDate = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date(iso)) : "";
