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

export function RequireModule({ module }: { module: import("@/types/api").TenantModule }) {
  const { hasModule, isLoading, isError } = useTenantSettings();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (isError || !hasModule(module)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/** @deprecated Use RequireModule module="PharmacyPickup" */
export function RequireGovPharmacy() {
  return <RequireModule module="PharmacyPickup" />;
}
