import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { DashboardPage } from "@/pages/DashboardPage";

/** Rota inicial única — conteúdo depende do escopo do JWT. */
export function HomePage() {
  const { isPlatform } = useAuth();
  return isPlatform ? <AdminOverviewPage /> : <DashboardPage />;
}

export function RequireTenant() {
  const { isTenant } = useAuth();
  if (!isTenant) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RequirePlatform() {
  const { isPlatform } = useAuth();
  if (!isPlatform) return <Navigate to="/" replace />;
  return <Outlet />;
}
