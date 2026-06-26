import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import {
  AdherenceTrendChart,
  CheckinsByHourChart,
  EngagementBarChart,
  MoriskyLevelChart,
  MoriskyTrendChart,
  MoriskyTriggerChart,
  TpbConstructChart,
  TpbTrendChart,
  TpbTriggerChart,
  PatientFunnelChart,
  ResponseByDayChart,
  SimpleBarChart,
} from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { BehavioralBarriersReportCard } from "@/components/reports/BehavioralBarriersReportCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, MORISKY_LEVEL_LABELS, PATIENT_STATUS_LABELS, TPB_CONSTRUCT_LABELS, TPB_RISK_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatPercent, maskPhone } from "@/lib/utils";
import type { MessageEngagement, NudgeEngagementRow } from "@/types/api";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

function ReportRangePicker({
  range,
  onChange,
}: {
  range: { from: string; to: string };
  onChange: (r: { from: string; to: string }) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Período</CardTitle>
        <CardDescription>Filtro aplicado aos relatórios com data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">De</Label>
          <Input
            id="from"
            type="date"
            value={range.from.slice(0, 10)}
            onChange={(e) =>
              onChange({ ...range, from: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Até</Label>
          <Input
            id="to"
            type="date"
            value={range.to.slice(0, 10)}
            onChange={(e) => onChange({ ...range, to: new Date(e.target.value).toISOString() })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const { token, hasFeature } = useAuth();
  const [range, setRange] = useState(defaultRange);
  const [exportingPdf, setExportingPdf] = useState(false);

  const adherence = useQuery({
    queryKey: ["adherence-report", range],
    queryFn: () => api.getAdherenceReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsBasic),
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

  if (!hasFeature(FEATURE_KEYS.reportsBasic)) {
    return (
      <>
        <PageHeader title="Relatórios" description="Adesão e engajamento do programa" />
        <FeatureLocked
          title="Relatórios não disponíveis"
          description="Relatórios básicos não estão disponíveis para sua conta."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Adesão, engajamento e operação do programa de medicamentos"
        actions={
          hasFeature(FEATURE_KEYS.reportsPdf) ? (
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={exportingPdf || adherence.isLoading || !adherence.data}
            >
              <FileDown className="size-4" />
              {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
            </Button>
          ) : undefined
        }
      />

      <ReportRangePicker range={range} onChange={setRange} />

      <Tabs defaultValue="adherence">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="adherence">Adesão</TabsTrigger>
          <TabsTrigger value="engagement" disabled={!hasFeature(FEATURE_KEYS.reportsAdvanced)}>
            Engajamento
          </TabsTrigger>
          <TabsTrigger value="nudge" disabled={!hasFeature(FEATURE_KEYS.reportsAdvanced)}>
            Nudge
          </TabsTrigger>
          {hasFeature(FEATURE_KEYS.reportsCohort) && (
            <TabsTrigger value="cohort">Funil e ranking</TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.reportsOperations) && (
            <TabsTrigger value="operations">Operação</TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.reportsBySender) && (
            <TabsTrigger value="senders">Remetentes</TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.reportsCohort) && (
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.scalesMorisky) && (
            <TabsTrigger value="morisky">MMAS-8</TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.scalesTpb) && (
            <TabsTrigger value="tpb">TCP</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="adherence" className="space-y-6">
          {adherence.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : adherence.data ? (
            <>
              {token && (
                <ReportAiInsightCard token={token} from={range.from} to={range.to} />
              )}

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
                <FeatureLocked
                  title="Gráficos de adesão"
                  description="Recurso indisponível no momento."
                />
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="engagement">
          {!hasFeature(FEATURE_KEYS.reportsAdvanced) ? (
            <FeatureLocked
              title="Relatório avançado"
              description="Recurso indisponível no momento."
            />
          ) : engagement.isError && engagement.error instanceof ApiClientError ? (
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
          {!hasFeature(FEATURE_KEYS.reportsAdvanced) ? (
            <FeatureLocked
              title="Relatório de nudge"
              description="Recurso indisponível no momento."
            />
          ) : nudgeEngagement.isError && nudgeEngagement.error instanceof ApiClientError ? (
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

        <TabsContent value="operations" className="space-y-6">
          {operations.isLoading ? (
            <Skeleton className="h-48" />
          ) : operations.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={range.from}
                  to={range.to}
                  variant="operations"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Lembretes enviados" value={operations.data.reminders.sent} />
                <MetricCard
                  title="Taxa de falha"
                  value={formatPercent(operations.data.reminders.failureRate)}
                />
                <MetricCard title="Follow-ups" value={operations.data.reminders.followupsSent} />
                <MetricCard
                  title="Reativações"
                  value={formatPercent(operations.data.reengagements.reactivationRate)}
                />
              </div>
              {hasFeature(FEATURE_KEYS.reportsCharts) && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <SimpleBarChart
                    title="Lembretes"
                    description="Status no período"
                    data={[
                      { label: "Enviados", value: operations.data.reminders.sent },
                      { label: "Falha", value: operations.data.reminders.failed },
                      { label: "Pendentes", value: operations.data.reminders.pending },
                      { label: "Ignorados", value: operations.data.reminders.skipped },
                    ]}
                  />
                  <SimpleBarChart
                    title="Reengajamento"
                    data={[
                      { label: "Reativados", value: operations.data.reengagements.reactivated },
                      { label: "Ignorados", value: operations.data.reengagements.ignored },
                      { label: "Opt-out", value: operations.data.reengagements.optedOut },
                      { label: "Pendentes", value: operations.data.reengagements.pending },
                    ]}
                  />
                </div>
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="senders">
          {token && (
            <div className="mb-6">
              <ReportAiInsightCard
                token={token}
                from={range.from}
                to={range.to}
                variant="senders"
              />
            </div>
          )}
          <SendersPerformanceTable rows={senders.data ?? []} loading={senders.isLoading} />
        </TabsContent>

        <TabsContent value="morisky" className="space-y-6">
          {morisky.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : morisky.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={range.from}
                  to={range.to}
                  variant="morisky"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Avaliações" value={morisky.data.totalAssessments} />
                <MetricCard
                  title="Score normalizado médio"
                  value={formatPercent(morisky.data.avgNormalizedScore)}
                />
                <MetricCard
                  title="Adesão check-in"
                  value={formatPercent(morisky.data.checkinAdherenceRate)}
                />
                <MetricCard
                  title="Baixa adesão"
                  value={morisky.data.byLevel.find((l) => l.level === "low")?.count ?? 0}
                />
              </div>

              {morisky.data.totalAssessments > 0 ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <MoriskyTrendChart data={morisky.data.trend} />
                    <MoriskyLevelChart data={morisky.data.byLevel} />
                    {morisky.data.byTrigger.length > 0 && (
                      <MoriskyTriggerChart data={morisky.data.byTrigger} />
                    )}
                  </div>

                  {morisky.data.patientRanking.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif text-lg">Ranking de pacientes</CardTitle>
                        <CardDescription>Últimas avaliações MMAS-8 no período</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Paciente</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead>Nível</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {morisky.data.patientRanking.map((row) => (
                              <TableRow key={`${row.patientId}-${row.completedAt}`}>
                                <TableCell>
                                  <Link
                                    to={`/pacientes/${row.patientId}`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {row.patientName ?? maskPhone(row.phone)}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {row.score}/{row.maxScore}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {MORISKY_LEVEL_LABELS[row.level] ?? row.level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(row.completedAt).toLocaleDateString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma avaliação MMAS-8 concluída no período. Conclua o onboarding com MMAS-8
                  habilitado ou aguarde gatilhos periódicos.
                </p>
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="tpb" className="space-y-6">
          {tpb.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : tpb.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={range.from}
                  to={range.to}
                  variant="tpb"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Avaliações" value={tpb.data.totalAssessments} />
                <MetricCard
                  title="Intenção média"
                  value={`${tpb.data.avgIntentionScore.toFixed(1)}/5`}
                />
                <MetricCard
                  title="Adesão check-in"
                  value={formatPercent(tpb.data.checkinAdherenceRate)}
                />
                <MetricCard
                  title="Pacientes com risco"
                  value={tpbRisk.data?.totalScored ?? "—"}
                />
              </div>

              {tpbRisk.data && tpbRisk.data.totalScored > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Risco preditivo na carteira</CardTitle>
                    <CardDescription>
                      Modelo de risco de não adesão — {tpbRisk.data.totalScored} paciente(s) pontuados
                      {tpbRisk.data.lastComputedAt && (
                        <> · atualizado em {new Date(tpbRisk.data.lastComputedAt).toLocaleDateString("pt-BR")}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    {tpbRisk.data.distribution.map((d) => (
                      <div key={d.label} className="rounded-lg border p-4">
                        <Badge variant="secondary" className="mb-2">
                          {TPB_RISK_LABELS[d.label] ?? d.label}
                        </Badge>
                        <p className="font-serif text-2xl">{d.count}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPercent(d.percentage)} da carteira
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {tpb.data.totalAssessments > 0 ? (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <TpbTrendChart data={tpb.data.trend} />
                    {tpb.data.byConstruct.length > 0 && (
                      <TpbConstructChart data={tpb.data.byConstruct} />
                    )}
                    {tpb.data.byTrigger.length > 0 && (
                      <TpbTriggerChart data={tpb.data.byTrigger} />
                    )}
                  </div>

                  {tpb.data.patientRanking.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif text-lg">Ranking de pacientes</CardTitle>
                        <CardDescription>Últimas avaliações TCP no período</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Paciente</TableHead>
                              <TableHead>Intenção</TableHead>
                              <TableHead>Construtos</TableHead>
                              <TableHead>Data</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tpb.data.patientRanking.map((row) => (
                              <TableRow key={`${row.patientId}-${row.completedAt}`}>
                                <TableCell>
                                  <Link
                                    to={`/pacientes/${row.patientId}`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {row.patientName ?? maskPhone(row.phone)}
                                  </Link>
                                </TableCell>
                                <TableCell>{row.intentionScore.toFixed(1)}/5</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {Object.entries(row.constructScores)
                                    .map(
                                      ([k, v]) =>
                                        `${TPB_CONSTRUCT_LABELS[k] ?? k}: ${v.toFixed(1)}`,
                                    )
                                    .join(" · ")}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(row.completedAt).toLocaleDateString("pt-BR")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma avaliação TCP concluída no período. Habilite os gatilhos em TCP ou dispare
                  manualmente na ficha do paciente.
                </p>
              )}
            </>
          ) : null}
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
      </Tabs>
    </div>
  );
}

function ComparisonCard({
  label,
  rate,
  checkins,
}: {
  label: string;
  rate: number;
  checkins: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-2xl">{formatPercent(rate)}</p>
        <p className="text-sm text-muted-foreground">{checkins} check-ins</p>
      </CardContent>
    </Card>
  );
}

function RankingTable({
  title,
  rows,
  loading,
}: {
  title: string;
  rows?: {
    patientId: string;
    name: string | null;
    status: string;
    adherenceRate: number;
    totalCheckins: number;
  }[];
  loading: boolean;
}) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) =>
        matchesGridSearch(
          query,
          r.name,
          r.status,
          PATIENT_STATUS_LABELS[r.status],
          r.totalCheckins,
          formatPercent(r.adherenceRate),
        ),
      ),
    [query, rows],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-serif text-lg">{title}</CardTitle>
          <CardDescription>Mínimo 3 check-ins no período</CardDescription>
        </div>
        {!loading && (rows?.length ?? 0) > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar paciente ou status"
            resultCount={filtered.length}
            totalCount={rows?.length}
          />
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-32" />
        ) : !rows?.length ? (
          <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead>Check-ins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={4} message="Nenhum paciente corresponde à busca." />
              )}
              {filtered.map((r) => (
                <TableRow key={r.patientId}>
                  <TableCell>
                    <Link to={`/pacientes/${r.patientId}`} className="font-medium text-primary hover:underline">
                      {r.name ?? "Sem nome"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {PATIENT_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPercent(r.adherenceRate)}</TableCell>
                  <TableCell>{r.totalCheckins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function EngagementTable({ title, rows }: { title: string; rows: MessageEngagement[] }) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesGridSearch(
          query,
          r.groupLabel,
          r.sent,
          r.responded,
          formatPercent(r.responseRate),
          r.avgResponseSeconds,
        ),
      ),
    [query, rows],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por grupo ou métrica"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Respondidos</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Tempo médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={5} message="Nenhum registro corresponde à busca." />
              )}
              {filtered.map((r) => (
                <TableRow key={r.groupLabel}>
                  <TableCell>{r.groupLabel}</TableCell>
                  <TableCell>{r.sent}</TableCell>
                  <TableCell>{r.responded}</TableCell>
                  <TableCell>{formatPercent(r.responseRate)}</TableCell>
                  <TableCell>
                    {r.avgResponseSeconds != null ? `${Math.round(r.avgResponseSeconds)}s` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SendersPerformanceTable({
  rows,
  loading,
}: {
  rows: {
    senderId: string;
    displayName: string;
    phoneNumber: string;
    activePatients: number;
    checkinsTotal: number;
    adherenceRate: number;
  }[];
  loading: boolean;
}) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      rows.filter((s) =>
        matchesGridSearch(
          query,
          s.displayName,
          s.phoneNumber,
          maskPhone(s.phoneNumber),
          s.activePatients,
          s.checkinsTotal,
          formatPercent(s.adherenceRate),
        ),
      ),
    [query, rows],
  );

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-serif text-lg">Performance por remetente</CardTitle>
          <CardDescription>Números WhatsApp da organização no período</CardDescription>
        </div>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome ou telefone"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre remetentes em Configurações → WhatsApp.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ativos</TableHead>
                <TableHead>Check-ins</TableHead>
                <TableHead>Adesão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={5} message="Nenhum remetente corresponde à busca." />
              )}
              {filtered.map((s) => (
                <TableRow key={s.senderId}>
                  <TableCell className="font-medium">{s.displayName}</TableCell>
                  <TableCell className="font-mono text-xs">{maskPhone(s.phoneNumber)}</TableCell>
                  <TableCell>{s.activePatients}</TableCell>
                  <TableCell>{s.checkinsTotal}</TableCell>
                  <TableCell>{formatPercent(s.adherenceRate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function NudgeEngagementTable({ title, rows }: { title: string; rows: NudgeEngagementRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem nudges enviados no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Resp. 2h</TableHead>
                <TableHead>Taxa 2h</TableHead>
                <TableHead>Resp. 24h</TableHead>
                <TableHead>Taxa 24h</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.groupKey}>
                  <TableCell className="font-medium">{r.groupLabel}</TableCell>
                  <TableCell>{r.sent}</TableCell>
                  <TableCell>{r.respondedWithin2h}</TableCell>
                  <TableCell>{formatPercent(r.responseRate2h)}</TableCell>
                  <TableCell>{r.respondedWithin24h}</TableCell>
                  <TableCell>{formatPercent(r.responseRate24h)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
