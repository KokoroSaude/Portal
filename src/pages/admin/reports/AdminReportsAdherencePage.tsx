import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/QueryErrorState";
import {
  AdherenceTrendChart,
  CheckinsByHourChart,
  ResponseByDayChart,
  SimpleBarChart,
} from "@/components/reports/ReportCharts";
import { MetricCard, TenantMetricsTable } from "@/components/reports/AdminReportsShared";
import { ReportSectionHeader } from "@/components/reports/ReportSectionNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

export function AdminReportsAdherencePage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { from, to } = useReportApiRange();
  const { tenantFilter, canFetch, selectedTenantNames } = useAdminReportTenants();
  const [exportingPdf, setExportingPdf] = useState(false);

  const adherence = useQuery({
    queryKey: ["admin-adherence", range, tenantFilter],
    queryFn: () => api.adminGetAdherenceReport(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const trend = useQuery({
    queryKey: ["admin-adherence-trend", range, tenantFilter],
    queryFn: () => api.adminGetAdherenceTrend(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const engagement = useQuery({
    queryKey: ["admin-engagement", range, tenantFilter],
    queryFn: () => api.adminGetEngagementReport(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const funnel = useQuery({
    queryKey: ["admin-funnel", tenantFilter],
    queryFn: () => api.adminGetPatientFunnel(token!, tenantFilter),
    enabled: !!token && canFetch,
  });

  const rankingBest = useQuery({
    queryKey: ["admin-ranking-best", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, from, to, 10, false, tenantFilter),
    enabled: !!token && canFetch,
  });

  const rankingWorst = useQuery({
    queryKey: ["admin-ranking-worst", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, from, to, 10, true, tenantFilter),
    enabled: !!token && canFetch,
  });

  const operations = useQuery({
    queryKey: ["admin-operations", range, tenantFilter],
    queryFn: () => api.adminGetOperationsReport(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const senders = useQuery({
    queryKey: ["admin-senders", range, tenantFilter],
    queryFn: () => api.adminGetSenderPerformance(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const comparison = useQuery({
    queryKey: ["admin-comparison", range, tenantFilter],
    queryFn: () => api.adminGetPeriodComparison(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const morisky = useQuery({
    queryKey: ["admin-morisky", range, tenantFilter],
    queryFn: () => api.adminGetMoriskyReport(token!, from, to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const handleExportPdf = async () => {
    if (!adherence.data) {
      toast.error("Aguarde o carregamento dos relatórios.");
      return;
    }

    setExportingPdf(true);
    try {
      const [{ buildAdminReportPdf }, { downloadReportPdf }, { captureAdminReportCharts }] =
        await Promise.all([
          import("@/lib/buildReportPdfDocument"),
          import("@/lib/reportPdf"),
          import("@/lib/reportChartCapture"),
        ]);

      let chartImages;
      try {
        chartImages = await captureAdminReportCharts({
          trend: trend.data,
          adherence: adherence.data,
          engagement: engagement.data,
          funnel: funnel.data,
          morisky: morisky.data,
        });
      } catch {
        toast.message("PDF gerado sem alguns gráficos.");
      }

      const doc = buildAdminReportPdf({
        range,
        tenantNames: selectedTenantNames,
        chartImages,
        adherence: adherence.data,
        trend: trend.data,
        engagement: engagement.data,
        funnel: funnel.data,
        rankingBest: rankingBest.data,
        rankingWorst: rankingWorst.data,
        operations: operations.data,
        senders: senders.data,
        comparison: comparison.data,
        morisky: morisky.data,
      });
      downloadReportPdf(doc);
      toast.success("PDF exportado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <ReportSectionHeader
        title="Adesão"
        description="Métricas consolidadas de adesão no período."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exportingPdf || adherence.isLoading || !adherence.data}
          >
            <FileDown className="size-4" />
            {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
          </Button>
        }
      />

      {adherence.isError ? (
        <QueryErrorState
          message="Não foi possível carregar o relatório de adesão."
          error={adherence.error}
          onRetry={() => void adherence.refetch()}
        />
      ) : adherence.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : adherence.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Taxa de adesão" value={formatPercent(adherence.data.adherenceRate)} />
            <MetricCard title="Check-ins" value={adherence.data.totalCheckins} />
            <MetricCard title="Tomados" value={adherence.data.takenCount} />
            <MetricCard title="Pacientes ativos" value={adherence.data.activePatients} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {trend.isLoading ? (
              <Skeleton className="h-72" />
            ) : (
              <AdherenceTrendChart data={trend.data ?? []} />
            )}
            <CheckinsByHourChart data={adherence.data.checkinsByHour} />
            <ResponseByDayChart data={adherence.data.avgResponseByDay} />
            {adherence.data.byTenant.length > 1 && (
              <SimpleBarChart
                title="Adesão por organização"
                description="Comparativo no período selecionado"
                data={adherence.data.byTenant.map((t) => ({
                  label: t.tenantName,
                  value: Math.round(t.adherenceRate * 100),
                }))}
              />
            )}
          </div>

          {adherence.data.byTenant.length > 0 && (
            <TenantMetricsTable rows={adherence.data.byTenant} />
          )}
        </>
      ) : null}
    </div>
  );
}
