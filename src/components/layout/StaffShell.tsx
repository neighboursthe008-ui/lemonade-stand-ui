import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/stores/auth";
import { staffNav } from "@/config/navigation";
import { Logo } from "./Logo";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { can, user } = useAuth();
  const groups = staffNav
    .map((g) => ({ ...g, items: g.items.filter((i) => (i.superAdminOnly ? user?.is_super_admin : !i.permission || can(i.permission))) }))
    .filter((g) => g.items.length);
  return (
    <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            <g.icon className="h-3.5 w-3.5" aria-hidden /> {g.label}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.to}>
                {i.ready ? (
                  <Link to={i.to} onClick={onNavigate} className="block rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-medium" }}>
                    {i.label}
                  </Link>
                ) : (
                  <span aria-disabled className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/40" title="Arrives in a later build phase">
                    {i.label}<span className="text-[10px] uppercase">soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const { user, logout, isDevSession, activeBranchId, setActiveBranchId } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signOut = async () => { await logout(); navigate({ to: "/auth/login", replace: true }); };

  const side = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5"><Logo inverted /></div>
      <SidebarNav onNavigate={() => setOpen(false)} />
      <div className="border-t border-sidebar-border p-4 text-sm">
        <p className="truncate font-medium">{user?.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">{user?.roles.join(", ").replace(/_/g, " ")}</p>
        {isDevSession && <p className="mt-1 text-[11px] text-sidebar-primary">Development profile — no Laravel session</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{side}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal aria-label="Navigation">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw]">{side}
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 text-sidebar-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="flex-1" />
          {user && user.branches.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">Branch</span>
              <select className="max-w-[11rem] rounded-md border bg-card px-2 py-1.5 text-sm" value={activeBranchId ?? ""} onChange={(e) => setActiveBranchId(Number(e.target.value))}>
                {user.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
