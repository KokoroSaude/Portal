import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import { EngagementBarChart, PatientFunnelChart } from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { ReportSectionNav } from "@/components/reports/ReportSectionNav";
import {
  ComparisonCard,
  EngagementTable,
  NudgeEngagementTable,
  RankingTable,
} from "@/components/reports/ReportsShared";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { resolveReportTab } from "@/lib/reportNavigation";

export function ReportsEngagementPage() {
  const { token, hasFeature } = useAuth();
  const { tab, setTab, searchQuery } = useReportRange();
  const { from, to } = useReportApiRange();

  const engagement = useQuery({
    queryKey: ["engagement-report", from, to],
    queryFn: () => api.getEngagementReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const nudgeEngagement = useQuery({
    queryKey: ["nudge-engagement-report", from, to],
    queryFn: () => api.getNudgeEngagementReport(token!, from, to),
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

  const comparison = useQuery({
    queryKey: ["period-comparison", from, to],
    queryFn: () => api.getPeriodComparison(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsCohort),
  });

  if (!hasFeature(FEATURE_KEYS.reportsAdvanced) && !hasFeature(FEATURE_KEYS.reportsCohort)) {
    return (
      <FeatureLocked
        title="Relatórios de engajamento não disponíveis"
        description="Este recurso não está incluído no seu plano atual."
      />
    );
  }

  const navItems = [
    { value: "engagement", label: "Engajamento", hidden: !hasFeature(FEATURE_KEYS.reportsAdvanced) },
    { value: "nudge", label: "Nudge", hidden: !hasFeature(FEATURE_KEYS.reportsAdvanced) },
    { value: "cohort", label: "Funil e ranking", hidden: !hasFeature(FEATURE_KEYS.reportsCohort) },
    { value: "comparison", label: "Comparativo", hidden: !hasFeature(FEATURE_KEYS.reportsCohort) },
  ];
  const defaultTab = hasFeature(FEATURE_KEYS.reportsAdvanced) ? "engagement" : "cohort";
  const activeTab = resolveReportTab(
    tab,
    defaultTab,
    navItems.filter((i) => !i.hidden).map((i) => i.value),
  );

  return (
    <div className="space-y-4">
      <ReportSectionNav items={navItems} value={activeTab} onChange={setTab} />

      {activeTab === "engagement" && hasFeature(FEATURE_KEYS.reportsAdvanced) && (
        <>
          {engagement.isError ? (
            <QueryErrorState
              message="Não foi possível carregar o relatório de engajamento."
              error={engagement.error}
              onRetry={() => engagement.refetch()}
            />
          ) : engagement.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : engagement.data ? (
            <div className="space-y-4">
              {token && (
                <ReportAiInsightCard token={token} from={from} to={to} variant="engagement" />
              )}
              {hasFeature(FEATURE_KEYS.reportsCharts) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <EngagementBarChart title="Por tipo de mensagem" rows={engagement.data.byMessageKind} />
                  <EngagementBarChart title="Por template" rows={engagement.data.byTemplate} />
                </div>
              )}
              <EngagementTable
                title="Detalhe por tipo"
                rows={engagement.data.byMessageKind}
                searchQuery={searchQuery}
              />
              <EngagementTable
                title="Detalhe por template"
                rows={engagement.data.byTemplate}
                searchQuery={searchQuery}
              />
            </div>
          ) : null}
        </>
      )}

      {activeTab === "nudge" && hasFeature(FEATURE_KEYS.reportsAdvanced) && (
        <>
          {nudgeEngagement.isError ? (
            <QueryErrorState
              message="Não foi possível carregar o engajamento de nudges."
              error={nudgeEngagement.error}
              onRetry={() => nudgeEngagement.refetch()}
            />
          ) : nudgeEngagement.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : nudgeEngagement.data ? (
            <div className="space-y-4">
              {token && <ReportAiInsightCard token={token} from={from} to={to} variant="nudge" />}
              <NudgeEngagementTable
                title="Por tipo de nudge"
                rows={nudgeEngagement.data.byNudgeType}
                searchQuery={searchQuery}
              />
              <NudgeEngagementTable
                title="Por template / variante"
                rows={nudgeEngagement.data.byTemplate}
                searchQuery={searchQuery}
              />
            </div>
          ) : null}
        </>
      )}

      {activeTab === "cohort" && hasFeature(FEATURE_KEYS.reportsCohort) && (
        <div className="space-y-4">
          {token && <ReportAiInsightCard token={token} from={from} to={to} variant="cohort" />}
          <div className="grid gap-4 lg:grid-cols-2">
            {funnel.isLoading ? (
              <Skeleton className="h-80" />
            ) : funnel.isError ? (
              <QueryErrorState
                message="Não foi possível carregar o funil de pacientes."
                error={funnel.error}
                onRetry={() => funnel.refetch()}
              />
            ) : (
              <PatientFunnelChart segments={funnel.data?.segments ?? []} />
            )}
            <RankingTable
              title="Melhor adesão no período"
              rows={rankingBest.data}
              loading={rankingBest.isLoading}
              searchQuery={searchQuery}
            />
          </div>
          <RankingTable
            title="Menor adesão no período"
            rows={rankingWorst.data}
            loading={rankingWorst.isLoading}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {activeTab === "comparison" && hasFeature(FEATURE_KEYS.reportsCohort) && (
        <>
          {comparison.isLoading ? (
            <Skeleton className="h-40" />
          ) : comparison.isError ? (
            <QueryErrorState
              message="Não foi possível carregar a comparação de períodos."
              error={comparison.error}
              onRetry={() => comparison.refetch()}
            />
          ) : comparison.data ? (
            <div className="space-y-4">
              {token && (
                <ReportAiInsightCard token={token} from={from} to={to} variant="comparison" />
              )}
              <div className="grid gap-3 sm:grid-cols-3">
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
                  <CardHeader className="pb-1 py-3">
                    <CardDescription className="text-xs">Variação</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 space-y-1">
                    <p className="font-serif text-2xl">
                      {comparison.data.delta.adherenceRatePoints >= 0 ? "+" : ""}
                      {(comparison.data.delta.adherenceRatePoints * 100).toFixed(1)} pp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check-ins: {comparison.data.delta.totalCheckins >= 0 ? "+" : ""}
                      {comparison.data.delta.totalCheckins}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
