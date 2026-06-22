import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { Skeleton } from "@/components/ui/skeleton";

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

export function RequireGovPharmacy() {
  const { pickupAccess, isLoading, isError } = useTenantSettings();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (isError || !pickupAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
