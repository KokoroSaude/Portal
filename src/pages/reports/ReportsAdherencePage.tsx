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
import { BehavioralBarriersReportCard } from "@/components/reports/BehavioralBarriersReportCard";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

export function ReportsAdherencePage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();
  const [exportingPdf, setExportingPdf] = useState(false);

  const adherence = useQuery({
    queryKey: ["adherence-report", range],
    queryFn: () => api.getAdherenceReport(token!, range.from, range.to),
    enabled: !!token,
  });

  const trend = useQuery({
    queryKey: ["adherence-trend", range],
    queryFn: () => api.getAdherenceTrend(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCharts),
  });

  const engagement = useQuery({
    queryKey: ["engagement-report", range],
    queryFn: () => api.getEngagementReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const funnel = useQuery({
    queryKey: ["patient-funnel"],
    queryFn: () => api.getPatientFunnel(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const rankingBest = useQuery({
    queryKey: ["patient-ranking-best", range],
    queryFn: () => api.getPatientRanking(token!, range.from, range.to, 8, false),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const rankingWorst = useQuery({
    queryKey: ["patient-ranking-worst", range],
    queryFn: () => api.getPatientRanking(token!, range.from, range.to, 8, true),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const operations = useQuery({
    queryKey: ["operations-report", range],
    queryFn: () => api.getOperationsReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsOperations),
  });

  const senders = useQuery({
    queryKey: ["sender-performance", range],
    queryFn: () => api.getSenderPerformance(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsBySender),
  });

  const comparison = useQuery({
    queryKey: ["period-comparison", range],
    queryFn: () => api.getPeriodComparison(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  const morisky = useQuery({
    queryKey: ["morisky-report", range],
    queryFn: () => api.getMoriskyReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.scalesMorisky),
  });

  const tpb = useQuery({
    queryKey: ["tpb-report", range],
    queryFn: () => api.getTpbReport(token!, range.from, range.to),
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
      const [{ buildTenantReportPdf }, { downloadReportPdf }] = await Promise.all([
        import("@/lib/buildReportPdfDocument"),
        import("@/lib/reportPdf"),
      ]);
      const doc = buildTenantReportPdf({
        range,
        features: {
          charts: hasFeature(FEATURE_KEYS.reportsCharts),
          advanced: hasFeature(FEATURE_KEYS.reportsAdvanced),
          cohort: hasFeature(FEATURE_KEYS.reportsCohort),
          operations: hasFeature(FEATURE_KEYS.reportsOperations),
          bySender: hasFeature(FEATURE_KEYS.reportsBySender),
        },
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
    <div className="space-y-6">
      {hasFeature(FEATURE_KEYS.reportsPdf) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf || adherence.isLoading || !adherence.data}
          >
            <FileDown className="size-4" />
            {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
          </Button>
        </div>
      )}

      {adherence.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : adherence.data ? (
        <>
          {token && <ReportAiInsightCard token={token} from={range.from} to={range.to} />}

          {token && hasFeature(FEATURE_KEYS.behavioralProfile) && (
            <BehavioralBarriersReportCard token={token} />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Taxa de adesão" value={formatPercent(adherence.data.adherenceRate)} />
            <MetricCard title="Check-ins" value={adherence.data.totalCheckins} />
            <MetricCard title="Tomados" value={adherence.data.takenCount} />
            <MetricCard title="Pacientes ativos" value={adherence.data.activePatients} />
          </div>

          {hasFeature(FEATURE_KEYS.reportsCharts) ? (
            <div className="grid gap-6 lg:grid-cols-2">
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
