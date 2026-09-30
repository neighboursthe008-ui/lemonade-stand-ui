import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "@/api/auth/auth.service";
import { configureHttp } from "@/api/client/http";
import { devProfiles } from "@/mocks/auth/devProfiles";
import type { CurrentUser } from "@/types/auth";

type Status = "loading" | "authenticated" | "anonymous";
interface AuthCtx {
  status: Status;
  user: CurrentUser | null;
  isDevSession: boolean;
  activeBranchId: number | null;
  setActiveBranchId: (id: number) => void;
  login: (email: string, password: string) => Promise<CurrentUser>;
  loginAsDevProfile: (id: number) => void;
  logout: () => Promise<void>;
  can: (permission: string | string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
// sessionStorage: token survives reload but not a closed tab. Never store the Super Admin PIN.
const TOKEN_KEY = "munab.token";
const DEV_KEY = "munab.devProfile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDevSession, setDev] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);

  const clear = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DEV_KEY);
    setToken(null); setUser(null); setDev(false); setStatus("anonymous");
  }, []);

  useEffect(() => {
    configureHttp({ getToken: () => sessionStorage.getItem(TOKEN_KEY), onUnauthenticated: clear });
    const dev = sessionStorage.getItem(DEV_KEY);
    if (dev) {
      const p = devProfiles.find((d) => d.id === Number(dev));
      if (p) { setUser(p); setDev(true); setActiveBranchId(p.branch_id); setStatus("authenticated"); return; }
    }
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (!t) { setStatus("anonymous"); return; }
    setToken(t);
    authService.me().then((r) => { setUser(r.data); setActiveBranchId(r.data.branch_id); setStatus("authenticated"); }).catch(clear);
  }, [clear]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authService.login(email, password);
    sessionStorage.setItem(TOKEN_KEY, r.data.token);
    setToken(r.data.token);
    const me = await authService.me(); // authoritative capability source
    setUser(me.data); setActiveBranchId(me.data.branch_id); setDev(false); setStatus("authenticated");
    return me.data;
  }, []);

  const loginAsDevProfile = useCallback((id: number) => {
    const p = devProfiles.find((d) => d.id === id);
    if (!p) return;
    sessionStorage.setItem(DEV_KEY, String(id));
    setUser(p); setDev(true); setActiveBranchId(p.branch_id); setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    if (token && !isDevSession) await authService.logout().catch(() => {});
    clear();
  }, [token, isDevSession, clear]);

  const value = useMemo<AuthCtx>(() => ({
    status, user, isDevSession, activeBranchId, setActiveBranchId, login, loginAsDevProfile, logout,
    can: (p) => !!user && (user.is_super_admin || (Array.isArray(p) ? p.some((x) => user.permissions.includes(x)) : user.permissions.includes(p))),
    hasRole: (r) => !!user && (Array.isArray(r) ? r.some((x) => user.roles.includes(x)) : user.roles.includes(r)),
  }), [status, user, isDevSession, activeBranchId, login, loginAsDevProfile, logout]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
