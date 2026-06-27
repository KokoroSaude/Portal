import { Outlet } from "react-router-dom";
import { AdminReportTenantSelector } from "@/components/admin/AdminReportTenantSelector";
import { PageHeader } from "@/components/PageHeader";
import { ReportRangePicker } from "@/components/reports/ReportsShared";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminReportTenantProvider,
  useAdminReportTenants,
} from "@/contexts/AdminReportTenantContext";
import { ReportRangeProvider, useReportRange } from "@/contexts/ReportRangeContext";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";

function AdminReportsLayoutContent() {
  const { range, setRange } = useReportRange();
  const { selectedIds, setSelectedIds, tenantsLoading } = useAdminReportTenants();
  const { tenants: activeTenants } = useActiveAdminTenants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios da plataforma"
        description="Métricas consolidadas de todas as organizações — escolha quais incluir"
      />

      {tenantsLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <AdminReportTenantSelector
          tenants={activeTenants}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      )}

      {selectedIds.size === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos uma organização para carregar os relatórios.
          </CardContent>
        </Card>
      ) : (
        <>
          <ReportRangePicker range={range} onChange={setRange} />
          <Outlet />
        </>
      )}
    </div>
  );
}

function AdminReportsLayoutInner() {
  return (
    <ReportRangeProvider>
      <AdminReportTenantProvider>
        <AdminReportsLayoutContent />
      </AdminReportTenantProvider>
    </ReportRangeProvider>
  );
}

export function AdminReportsLayout() {
  return <AdminReportsLayoutInner />;
}
