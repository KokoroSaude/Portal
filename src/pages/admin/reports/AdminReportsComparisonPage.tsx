import { useQuery } from "@tanstack/react-query";
import { ComparisonCard } from "@/components/reports/AdminReportsShared";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";

export function AdminReportsComparisonPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();

  const comparison = useQuery({
    queryKey: ["admin-comparison", range, tenantFilter],
    queryFn: () => api.adminGetPeriodComparison(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Comparativo</h2>
        <p className="text-sm text-muted-foreground">
          Variação de adesão entre o período selecionado e o anterior.
        </p>
      </div>

      {comparison.isLoading ? (
        <Skeleton className="h-40" />
      ) : comparison.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <ComparisonCard
            label="Período atual"
            rate={comparison.data.current.adherenceRate}
            checkins={comparison.data.current.totalCheckins}
          />
          <ComparisonCard
            label="Período anterior"
            rate={comparison.data.previous.adherenceRate}
            checkins={comparison.data.previous.totalCheckins}
          />
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardDescription>Variação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-serif text-2xl">
                {comparison.data.delta.adherenceRatePoints >= 0 ? "+" : ""}
                {(comparison.data.delta.adherenceRatePoints * 100).toFixed(1)} pp
              </p>
              <p className="text-sm text-muted-foreground">
                Check-ins: {comparison.data.delta.totalCheckins >= 0 ? "+" : ""}
                {comparison.data.delta.totalCheckins}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
