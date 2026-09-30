import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { clinic } from "@/config/clinic";
import { AssistantWidget } from "@/components/public/AssistantWidget";

const links = [
  { to: "/about", label: "About" },
  { to: "/departments", label: "Departments" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/blog", label: "Blog" },
  { to: "/news", label: "News" },
  
  { to: "/tenders", label: "Tenders" },
  { to: "/shop", label: "Shop" },
  { to: "/portal", label: "My portal" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden bg-lemon text-lemon-foreground hover:bg-lemon/90 sm:inline-flex"><Link to="/appointments">Book a visit</Link></Button>
            <Button asChild size="sm" variant="outline" className="hidden md:inline-flex"><Link to="/auth/login">Staff</Link></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <nav aria-label="Mobile" className="border-t px-4 py-3 lg:hidden">
            <ul className="grid grid-cols-2 gap-1">
              {[...links, { to: "/appointments", label: "Book a visit" }, { to: "/auth/login", label: "Staff sign in" }].map((l) => (
                <li key={l.to}><Link to={l.to} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-brand text-brand-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div><p className="font-display text-lg font-semibold">{clinic.name}</p><p className="mt-2 text-sm text-brand-foreground/70">{clinic.tagline}</p></div>
          <div>
            <p className="text-sm font-semibold">Visit</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-foreground/75">
              <li><Link to="/services" className="hover:text-brand-foreground">Services</Link></li>
              <li><Link to="/doctors" className="hover:text-brand-foreground">Doctors</Link></li>
              <li><Link to="/appointments" className="hover:text-brand-foreground">Book a visit</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Read</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-foreground/75">
              <li><Link to="/blog" className="hover:text-brand-foreground">Blog</Link></li>
              <li><Link to="/news" className="hover:text-brand-foreground">News</Link></li>
              <li><Link to="/testimonials" className="hover:text-brand-foreground">Testimonials</Link></li>
              <li><Link to="/tenders" className="hover:text-brand-foreground">Tenders</Link></li>
              <li><Link to="/events" className="hover:text-brand-foreground">Events</Link></li>
              <li><Link to="/gallery" className="hover:text-brand-foreground">Gallery</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Contact</p>
            <a href={clinic.phoneHref} className="mt-3 inline-flex items-center gap-2 text-sm text-brand-foreground/75 hover:text-brand-foreground"><Phone className="h-4 w-4" />{clinic.phone}</a>
          </div>
        </div>
        <div className="border-t border-brand-foreground/10">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-brand-foreground/60 sm:px-6">
            <p>© {new Date().getFullYear()} {clinic.name}</p>
            <Link to="/dev/integration-status" className="hover:text-brand-foreground">Integration status</Link>
          </div>
        </div>
      </footer>
      <AssistantWidget />
    </div>
  );
}
