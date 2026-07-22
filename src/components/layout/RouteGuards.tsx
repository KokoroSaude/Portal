import { Link, Navigate, Outlet } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { AdminOverviewPage } from "@/pages/admin/AdminOverviewPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryErrorState } from "@/components/QueryErrorState";
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
  const { hasModule, isLoading, isError, refetch } = useTenantSettings();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <QueryErrorState
          message="Não foi possível verificar os módulos habilitados."
          onRetry={() => refetch?.()}
        />
      </div>
    );
  }

  if (!hasModule(module)) {
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-md border-dashed border-primary/20 bg-accent/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="size-5 text-primary/70" aria-hidden />
              <CardTitle className="font-serif text-xl">Módulo não habilitado</CardTitle>
            </div>
            <CardDescription>
              Esta área depende de um módulo que não está ativo na sua organização. Fale com o
              administrador da plataforma para habilitá-lo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

/** @deprecated Use RequireModule module="PharmacyPickup" */
export function RequireGovPharmacy() {
  return <RequireModule module="PharmacyPickup" />;
}
