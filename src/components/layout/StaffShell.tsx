import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Bell, ChevronDown, ChevronRight, CircleHelp, Home, LogOut, MapPin, Menu, Search, Settings, X } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { staffNav } from "@/config/navigation";
import { Logo } from "./Logo";
import { GlobalSearch } from "@/components/search/GlobalSearch";

function initials(name?: string) {
  return (name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { can, user } = useAuth();
  const groups = staffNav
    .map((g) => ({ ...g, items: g.items.filter((i) => (i.superAdminOnly ? user?.is_super_admin : !i.permission || can(i.permission))) }))
    .filter((g) => g.items.length);
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
      {groups.map((g) => (
        <div key={g.label} className="border-b border-sidebar-border py-2 last:border-0">
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">{g.label}</p>
          <ul>
            {g.items.map((i) => {
              const inner = (
                <>
                  <i.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate">{i.label}</span>
                  {i.badge ? <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sidebar-primary px-1 text-[10px] font-bold text-sidebar-primary-foreground">{i.badge}</span> : null}
                </>
              );
              return (
                <li key={i.to}>
                  {i.ready ? (
                    <Link to={i.to} onClick={onNavigate} className="flex items-center gap-3 rounded-md px-2 py-[5px] text-[13px] text-sidebar-foreground hover:bg-sidebar-accent"
                      activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-semibold" }}>{inner}</Link>
                  ) : (
                    <span aria-disabled title="Arrives in a later build phase" className="flex cursor-not-allowed items-center gap-3 rounded-md px-2 py-[5px] text-[13px] text-sidebar-foreground/80">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const { user, logout, isDevSession, activeBranchId, setActiveBranchId } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const crumb = staffNav.flatMap((g) => g.items).find((i) => path === i.to || path.startsWith(i.to + "/"))?.label ?? "Dashboard";
  const signOut = async () => { await logout(); navigate({ to: "/auth/login", replace: true }); };

  const side = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pb-2 pt-4">
        <Logo inverted />
        <p className="mt-0.5 pl-11 text-[11px] text-sidebar-foreground/70">Kerugoya, Kenya</p>
      </div>
      <SidebarNav onNavigate={() => setOpen(false)} />
      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">{initials(user?.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-[11px] text-sidebar-foreground/70">{user?.email}</p>
          {isDevSession && <p className="text-[10px] text-sidebar-primary">Development profile</p>}
        </div>
        {user?.is_super_admin && <Link to="/app/$module" params={{ module: "settings" }} aria-label="Settings" onClick={() => setOpen(false)} className="text-sidebar-foreground/80 hover:text-sidebar-foreground"><Settings className="h-4 w-4" /></Link>}
        <button onClick={signOut} aria-label="Sign out" className="text-sidebar-foreground/80 hover:text-sidebar-foreground"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {!collapsed && <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{side}</aside>}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal aria-label="Navigation">
          <button aria-label="Close menu" className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw]">{side}
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 text-sidebar-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
      <div className={collapsed ? "" : "lg:pl-60"}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-5">
          <button aria-label="Toggle menu" className="text-foreground/80" onClick={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setOpen(true))}><Menu className="h-5 w-5" /></button>
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-sm sm:flex">
            <Home className="h-4 w-4 text-primary" /><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /><span>{crumb}</span>
          </nav>
          <div className="mx-auto hidden w-full max-w-md md:block">
            <button onClick={() => setSearchOpen(true)} className="flex w-full items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-left text-sm text-muted-foreground hover:border-primary/40">
              <Search className="h-4 w-4" /><span className="flex-1 truncate">Search patients, appointments, invoices, orders...</span><kbd className="rounded border px-1.5 text-[10px]">Ctrl K</kbd>
            </button>
          </div>
          <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <div className="ml-auto flex items-center gap-3">
            <button aria-label="Search" className="md:hidden" onClick={() => setSearchOpen(true)}><Search className="h-5 w-5 text-primary" /></button>
            <Link to="/app/$module" params={{ module: "notifications" }} aria-label="Notifications" className="relative"><Bell className="h-5 w-5 text-primary" />
              <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-lemon text-[10px] font-bold text-lemon-foreground">3</span></Link>
            {user && user.branches.length > 0 && (
              <label className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-sm sm:flex">
                <MapPin className="h-4 w-4 text-primary" />
                <select aria-label="Branch" className="max-w-[10rem] bg-transparent text-sm outline-none" value={activeBranchId ?? ""} onChange={(e) => setActiveBranchId(Number(e.target.value))}>
                  {user.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
            <Link to="/app/assistant" aria-label="Help and assistant" className="hidden sm:block"><CircleHelp className="h-5 w-5 text-primary" /></Link>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials(user?.name)}</div>
              <span className="hidden max-w-[10rem] truncate whitespace-nowrap text-sm font-medium lg:inline">{user?.name}</span>
              <ChevronDown className="hidden h-4 w-4 lg:block" />
            </div>
          </div>
        </header>
        <main className="px-4 py-5 sm:px-5">{children}</main>
      </div>
    </div>
  );
}
