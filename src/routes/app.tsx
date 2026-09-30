import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { StaffShell } from "@/components/layout/StaffShell";
import { LoadingState } from "@/components/states/States";
import { useAuth } from "@/stores/auth";

// Session lives in the browser (bearer token), so this area renders client-side only.
export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { status, user } = useAuth();
  if (status === "loading") return <LoadingState label="Checking your session…" />;
  if (status === "anonymous") return <Navigate to="/auth/login" replace />;
  if (user?.must_change_password) return <div className="p-8 text-center text-sm">Your password must be changed before continuing. Use “Forgot password” to set a new one.</div>;
  return <StaffShell><Outlet /></StaffShell>;
}
