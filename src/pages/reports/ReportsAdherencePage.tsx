import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { FeatureLocked } from "@/components/PageHeader";
import {
  AdherenceTrendChart,
  CheckinsByHourChart,
  ResponseByDayChart,
} from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { ReportSectionHeader } from "@/components/reports/ReportSectionNav";
import { BehavioralBarriersReportCard } from "@/components/reports/BehavioralBarriersReportCard";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

export function ReportsAdherencePage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();
  const { from, to } = useReportApiRange();
  const [exportingPdf, setExportingPdf] = useState(false);

  const adherence = useQuery({
    queryKey: ["adherence-report", from, to],
    queryFn: () => api.getAdherenceReport(token!, from, to),
    enabled: !!token,
  });

  const trend = useQuery({
    queryKey: ["adherence-trend", from, to],
    queryFn: () => api.getAdherenceTrend(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCharts),
  });

  const engagement = useQuery({
    queryKey: ["engagement-report", from, to],
    queryFn: () => api.getEngagementReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const funnel = useQuery({
    queryKey: ["patient-funnel"],
    queryFn: () => api.getPatientFunnel(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const rankingBest = useQuery({
    queryKey: ["patient-ranking-best", from, to],
    queryFn: () => api.getPatientRanking(token!, from, to, 8, false),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const rankingWorst = useQuery({
    queryKey: ["patient-ranking-worst", from, to],
    queryFn: () => api.getPatientRanking(token!, from, to, 8, true),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const operations = useQuery({
    queryKey: ["operations-report", from, to],
    queryFn: () => api.getOperationsReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsOperations),
  });

  const senders = useQuery({
    queryKey: ["sender-performance", from, to],
    queryFn: () => api.getSenderPerformance(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsBySender),
  });

  const comparison = useQuery({
    queryKey: ["period-comparison", from, to],
    queryFn: () => api.getPeriodComparison(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const morisky = useQuery({
    queryKey: ["morisky-report", from, to],
    queryFn: () => api.getMoriskyReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.scalesMorisky),
  });

  const tpb = useQuery({
    queryKey: ["tpb-report", from, to],
    queryFn: () => api.getTpbReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  const tpbRisk = useQuery({
    queryKey: ["tpb-risk-report"],
    queryFn: () => api.getTpbRiskReport(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  const handleExportPdf = async () => {
    if (!adherence.data) {
      toast.error("Aguarde o carregamento dos dados de adesão.");
      return;
    }

    setExportingPdf(true);
    try {
      const [{ buildTenantReportPdf }, { downloadReportPdf }, { captureTenantReportCharts }] =
        await Promise.all([
          import("@/lib/buildReportPdfDocument"),
          import("@/lib/reportPdf"),
          import("@/lib/reportChartCapture"),
        ]);

      let chartImages;
      try {
        chartImages = await captureTenantReportCharts({
          features: {
            charts: hasFeature(FEATURE_KEYS.reportsCharts),
            advanced: hasFeature(FEATURE_KEYS.reportsAdvanced),
            cohort: hasFeature(FEATURE_KEYS.reportsCohort),
            morisky: hasFeature(FEATURE_KEYS.scalesMorisky),
            tpb: hasFeature(FEATURE_KEYS.scalesTpb),
          },
          trend: trend.data,
          adherence: adherence.data,
          engagement: engagement.data,
          funnel: funnel.data,
        });
      } catch {
        toast.message("PDF gerado sem alguns gráficos.");
        chartImages = undefined;
      }

      const doc = buildTenantReportPdf({
        range,
        features: {
          charts: hasFeature(FEATURE_KEYS.reportsCharts),
          advanced: hasFeature(FEATURE_KEYS.reportsAdvanced),
          cohort: hasFeature(FEATURE_KEYS.reportsCohort),
          operations: hasFeature(FEATURE_KEYS.reportsOperations),
          bySender: hasFeature(FEATURE_KEYS.reportsBySender),
          morisky: hasFeature(FEATURE_KEYS.scalesMorisky),
          tpb: hasFeature(FEATURE_KEYS.scalesTpb),
        },
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
        tpb: tpb.data,
        tpbRisk: tpbRisk.data,
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
        description="Taxa de check-ins, tendências e barreiras no período selecionado."
        actions={
          hasFeature(FEATURE_KEYS.reportsPdf) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf || adherence.isLoading || !adherence.data}
            >
              <FileDown className="size-4" />
              {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
            </Button>
          ) : undefined
        }
      />

      {adherence.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : adherence.data ? (
        <>
          {token && <ReportAiInsightCard token={token} from={from} to={to} />}

          {token && hasFeature(FEATURE_KEYS.behavioralProfile) && (
            <>
              <ReportAiInsightCard token={token} from={from} to={to} variant="behavioral-barriers" />
              <BehavioralBarriersReportCard token={token} />
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Taxa de adesão" value={formatPercent(adherence.data.adherenceRate)} />
            <MetricCard title="Check-ins" value={adherence.data.totalCheckins} />
            <MetricCard title="Tomados" value={adherence.data.takenCount} />
            <MetricCard title="Pacientes ativos" value={adherence.data.activePatients} />
          </div>

          {hasFeature(FEATURE_KEYS.reportsCharts) ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {trend.isLoading ? (
                <Skeleton className="h-72" />
              ) : (
                <AdherenceTrendChart data={trend.data ?? []} />
              )}
              <CheckinsByHourChart data={adherence.data.checkinsByHour} />
              <ResponseByDayChart data={adherence.data.avgResponseByDay} />
            </div>
          ) : (
            <FeatureLocked title="Gráficos de adesão" description="Recurso indisponível no momento." />
          )}
        </>
      ) : null}
    </div>
  );
}
