import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import { EngagementBarChart, PatientFunnelChart } from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import {
  ComparisonCard,
  EngagementTable,
  NudgeEngagementTable,
  RankingTable,
} from "@/components/reports/ReportsShared";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function ReportsEngagementPage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();

  const engagement = useQuery({
    queryKey: ["engagement-report", range],
    queryFn: () => api.getEngagementReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const nudgeEngagement = useQuery({
    queryKey: ["nudge-engagement-report", range],
    queryFn: () => api.getNudgeEngagementReport(token!, range.from, range.to),
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

  const comparison = useQuery({
    queryKey: ["period-comparison", range],
    queryFn: () => api.getPeriodComparison(token!, range.from, range.to),
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

  return (
    <Tabs defaultValue="engagement">
      <TabsList className="flex h-auto flex-wrap gap-1">
        {hasFeature(FEATURE_KEYS.reportsAdvanced) && (
          <>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="nudge">Nudge</TabsTrigger>
          </>
        )}
        {hasFeature(FEATURE_KEYS.reportsCohort) && (
          <>
            <TabsTrigger value="cohort">Funil e ranking</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          </>
        )}
      </TabsList>

      {hasFeature(FEATURE_KEYS.reportsAdvanced) && (
        <>
          <TabsContent value="engagement">
            {engagement.isError && engagement.error instanceof ApiClientError ? (
              <p className="text-destructive">{engagement.error.message}</p>
            ) : engagement.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : engagement.data ? (
              <div className="space-y-6">
                {token && (
                  <ReportAiInsightCard
                    token={token}
                    from={range.from}
                    to={range.to}
                    variant="engagement"
                  />
                )}
                {hasFeature(FEATURE_KEYS.reportsCharts) && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <EngagementBarChart
                      title="Por tipo de mensagem"
                      rows={engagement.data.byMessageKind}
                    />
                    <EngagementBarChart title="Por template" rows={engagement.data.byTemplate} />
                  </div>
                )}
                <EngagementTable title="Detalhe por tipo" rows={engagement.data.byMessageKind} />
                <EngagementTable title="Detalhe por template" rows={engagement.data.byTemplate} />
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="nudge">
            {nudgeEngagement.isError && nudgeEngagement.error instanceof ApiClientError ? (
              <p className="text-destructive">{nudgeEngagement.error.message}</p>
            ) : nudgeEngagement.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : nudgeEngagement.data ? (
              <div className="space-y-6">
                {token && (
                  <ReportAiInsightCard
                    token={token}
                    from={range.from}
                    to={range.to}
                    variant="nudge"
                  />
                )}
                <NudgeEngagementTable
                  title="Por tipo de nudge"
                  rows={nudgeEngagement.data.byNudgeType}
                />
                <NudgeEngagementTable
                  title="Por template / variante"
                  rows={nudgeEngagement.data.byTemplate}
                />
              </div>
            ) : null}
          </TabsContent>
        </>
      )}

      {hasFeature(FEATURE_KEYS.reportsCohort) && (
        <>
          <TabsContent value="cohort" className="space-y-6">
            {token && (
              <ReportAiInsightCard
                token={token}
                from={range.from}
                to={range.to}
                variant="cohort"
              />
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              {funnel.isLoading ? (
                <Skeleton className="h-80" />
              ) : (
                <PatientFunnelChart segments={funnel.data?.segments ?? []} />
              )}
              <RankingTable
                title="Melhor adesão no período"
                rows={rankingBest.data}
                loading={rankingBest.isLoading}
              />
            </div>
            <RankingTable
              title="Menor adesão no período"
              rows={rankingWorst.data}
              loading={rankingWorst.isLoading}
            />
          </TabsContent>

          <TabsContent value="comparison">
            {comparison.isLoading ? (
              <Skeleton className="h-40" />
            ) : comparison.data ? (
              <div className="space-y-6">
                {token && (
                  <ReportAiInsightCard
                    token={token}
                    from={range.from}
                    to={range.to}
                    variant="comparison"
                  />
                )}
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
              </div>
            ) : null}
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
