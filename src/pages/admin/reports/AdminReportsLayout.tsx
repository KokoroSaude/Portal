import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminReportScopeControl } from "@/components/admin/AdminReportScopeControl";
import { ReportsLayoutShell } from "@/components/reports/ReportsLayoutShell";
import {
  AdminReportTenantProvider,
  useAdminReportTenants,
} from "@/contexts/AdminReportTenantContext";
import { ReportRangeProvider } from "@/contexts/ReportRangeContext";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";

function AdminReportsLayoutContent() {
  const { selectedIds, tenantsLoading } = useAdminReportTenants();
  const { tenants: activeTenants } = useActiveAdminTenants();

  if (tenantsLoading) {
    return (
      <ReportsLayoutShell
        title="Relatórios da plataforma"
        description="Métricas consolidadas de todas as organizações"
        showToolbar={false}
      >
        <Skeleton className="h-40 w-full" />
      </ReportsLayoutShell>
    );
  }

  if (activeTenants.length === 0) {
    return (
      <ReportsLayoutShell
        title="Relatórios da plataforma"
        description="Métricas consolidadas de todas as organizações"
        showToolbar={false}
      >
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma organização ativa disponível.
          </CardContent>
        </Card>
      </ReportsLayoutShell>
    );
  }

  if (selectedIds.size === 0) {
    return (
      <ReportsLayoutShell
        title="Relatórios da plataforma"
        description="Métricas consolidadas de todas as organizações"
        scopeControl={<AdminReportScopeControl />}
        showToolbar={false}
      >
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos uma organização para carregar os relatórios.
          </CardContent>
        </Card>
      </ReportsLayoutShell>
    );
  }

  return (
    <ReportsLayoutShell
      title="Relatórios da plataforma"
      description="Métricas consolidadas das organizações selecionadas"
      scopeControl={<AdminReportScopeControl />}
    />
  );
}

export function AdminReportsLayout() {
  return (
    <ReportRangeProvider>
      <AdminReportTenantProvider>
        <AdminReportsLayoutContent />
      </AdminReportTenantProvider>
    </ReportRangeProvider>
  );
}
