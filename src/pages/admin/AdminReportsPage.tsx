import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { AdminReportTenantSelector } from "@/components/admin/AdminReportTenantSelector";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import {
  AdherenceTrendChart,
  CheckinsByHourChart,
  EngagementBarChart,
  PatientFunnelChart,
  ResponseByDayChart,
  SimpleBarChart,
} from "@/components/reports/ReportCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api } from "@/lib/api";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatPercent, maskPhone } from "@/lib/utils";
import type { MessageEngagement } from "@/types/api";

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
          <Label htmlFor="admin-from">De</Label>
          <Input
            id="admin-from"
            type="date"
            value={range.from.slice(0, 10)}
            onChange={(e) =>
              onChange({ ...range, from: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-to">Até</Label>
          <Input
            id="admin-to"
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

export function AdminReportsPage() {
  const { token } = useAuth();
  const [range, setRange] = useState(defaultRange);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (tenantsQuery.data && !initialized) {
      setSelectedIds(new Set(tenantsQuery.data.filter((t) => t.isActive).map((t) => t.id)));
      setInitialized(true);
    }
  }, [tenantsQuery.data, initialized]);

  const tenantFilter = useMemo(() => {
    if (selectedIds.size === 0) return undefined;
    return Array.from(selectedIds);
  }, [selectedIds]);

  const canFetch = !!token && selectedIds.size > 0;

  const adherence = useQuery({
    queryKey: ["admin-adherence", range, tenantFilter],
    queryFn: () => api.adminGetAdherenceReport(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const trend = useQuery({
    queryKey: ["admin-adherence-trend", range, tenantFilter],
    queryFn: () => api.adminGetAdherenceTrend(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const engagement = useQuery({
    queryKey: ["admin-engagement", range, tenantFilter],
    queryFn: () => api.adminGetEngagementReport(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const funnel = useQuery({
    queryKey: ["admin-funnel", tenantFilter],
    queryFn: () => api.adminGetPatientFunnel(token!, tenantFilter),
    enabled: canFetch,
  });

  const rankingBest = useQuery({
    queryKey: ["admin-ranking-best", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, range.from, range.to, 10, false, tenantFilter),
    enabled: canFetch,
  });

  const rankingWorst = useQuery({
    queryKey: ["admin-ranking-worst", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, range.from, range.to, 10, true, tenantFilter),
    enabled: canFetch,
  });

  const operations = useQuery({
    queryKey: ["admin-operations", range, tenantFilter],
    queryFn: () => api.adminGetOperationsReport(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const senders = useQuery({
    queryKey: ["admin-senders", range, tenantFilter],
    queryFn: () => api.adminGetSenderPerformance(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const comparison = useQuery({
    queryKey: ["admin-comparison", range, tenantFilter],
    queryFn: () => api.adminGetPeriodComparison(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const volume = useQuery({
    queryKey: ["admin-volume", range, tenantFilter],
    queryFn: () => api.adminGetMessageVolumeMetrics(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const satisfaction = useQuery({
    queryKey: ["admin-satisfaction", range, tenantFilter],
    queryFn: () => api.adminGetSatisfactionMetrics(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const latency = useQuery({
    queryKey: ["admin-latency", range, tenantFilter],
    queryFn: () => api.adminGetOperationalLatencyMetrics(token!, range.from, range.to, tenantFilter),
    enabled: canFetch,
  });

  const auditLog = useQuery({
    queryKey: ["admin-audit-log", range, tenantFilter],
    queryFn: () =>
      api.adminGetAuditLog(token!, {
        from: range.from,
        to: range.to,
        tenantIds: tenantFilter,
        limit: 50,
      }),
    enabled: canFetch,
  });

  const interactionEvents = useQuery({
    queryKey: ["admin-interaction-events", range, tenantFilter],
    queryFn: () =>
      api.adminGetInteractionEvents(token!, {
        from: range.from,
        to: range.to,
        tenantIds: tenantFilter,
        limit: 50,
      }),
    enabled: canFetch,
  });

  const selectedTenantNames = useMemo(() => {
    if (!tenantsQuery.data) return [];
    return tenantsQuery.data.filter((t) => selectedIds.has(t.id)).map((t) => t.name);
  }, [tenantsQuery.data, selectedIds]);

  const handleExportPdf = async () => {
    if (!adherence.data) {
      toast.error("Aguarde o carregamento dos relatórios.");
      return;
    }

    setExportingPdf(true);
    try {
      const [{ buildAdminReportPdf }, { downloadReportPdf }] = await Promise.all([
        import("@/lib/buildReportPdfDocument"),
        import("@/lib/reportPdf"),
      ]);
      const doc = buildAdminReportPdf({
        range,
        tenantNames: selectedTenantNames,
        adherence: adherence.data,
        trend: trend.data,
        engagement: engagement.data,
        funnel: funnel.data,
        rankingBest: rankingBest.data,
        rankingWorst: rankingWorst.data,
        operations: operations.data,
        senders: senders.data,
        comparison: comparison.data,
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
      <PageHeader
        title="Relatórios da plataforma"
        description="Métricas consolidadas de todas as organizações — escolha quais incluir"
        actions={
          selectedIds.size > 0 ? (
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

      {tenantsQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : tenantsQuery.data ? (
        <AdminReportTenantSelector
          tenants={tenantsQuery.data}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      ) : null}

      {selectedIds.size === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Selecione ao menos uma organização para carregar os relatórios.
          </CardContent>
        </Card>
      ) : (
        <>
          <ReportRangePicker range={range} onChange={setRange} />

          <Tabs defaultValue="adherence">
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="adherence">Adesão</TabsTrigger>
              <TabsTrigger value="engagement">Engajamento</TabsTrigger>
              <TabsTrigger value="cohort">Funil e ranking</TabsTrigger>
              <TabsTrigger value="operations">Operação</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfação</TabsTrigger>
              <TabsTrigger value="traceability">Rastreabilidade</TabsTrigger>
              <TabsTrigger value="senders">Remetentes</TabsTrigger>
              <TabsTrigger value="comparison">Comparativo</TabsTrigger>
            </TabsList>

            <TabsContent value="adherence" className="space-y-6">
              {adherence.isLoading ? (
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
            </TabsContent>

            <TabsContent value="engagement">
              {engagement.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : engagement.data ? (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <EngagementBarChart
                      title="Por tipo de mensagem"
                      rows={engagement.data.byMessageKind}
                    />
                    <EngagementBarChart title="Por template" rows={engagement.data.byTemplate} />
                  </div>
                  <EngagementTable title="Detalhe por tipo" rows={engagement.data.byMessageKind} />
                  <EngagementTable title="Detalhe por template" rows={engagement.data.byTemplate} />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="cohort" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {funnel.isLoading ? (
                  <Skeleton className="h-80" />
                ) : (
                  <PatientFunnelChart segments={funnel.data?.segments ?? []} />
                )}
                <AdminRankingTable
                  title="Melhor adesão no período"
                  rows={rankingBest.data}
                  loading={rankingBest.isLoading}
                />
              </div>
              <AdminRankingTable
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

                  {latency.isLoading ? (
                    <Skeleton className="h-48" />
                  ) : latency.data && latency.data.sampleCount > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-serif text-lg">Latência de resposta clínica</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                          title="Média"
                          value={`${Math.round(latency.data.avgSeconds)}s`}
                        />
                        <MetricCard title="P50" value={`${Math.round(latency.data.p50Seconds)}s`} />
                        <MetricCard title="P95" value={`${Math.round(latency.data.p95Seconds)}s`} />
                        <MetricCard title="Amostras" value={latency.data.sampleCount} />
                      </div>
                      <SimpleBarChart
                        title="Latência média por dia"
                        description="Tempo entre mensagem do paciente e resposta do operador"
                        data={latency.data.byDay.map((d) => ({
                          label: d.date.slice(5),
                          value: Math.round(d.avgSeconds),
                        }))}
                      />
                    </div>
                  ) : null}
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="volume" className="space-y-6">
              {volume.isLoading ? (
                <Skeleton className="h-48" />
              ) : volume.data ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard
                      title="Inbound"
                      value={volume.data.messagesByDay.reduce((s, d) => s + d.inbound, 0)}
                    />
                    <MetricCard
                      title="Outbound"
                      value={volume.data.messagesByDay.reduce((s, d) => s + d.outbound, 0)}
                    />
                    <MetricCard title="Respostas de operadores" value={volume.data.teamThroughput.length} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <SimpleBarChart
                      title="Mensagens por dia (inbound)"
                      data={volume.data.messagesByDay.map((d) => ({
                        label: d.date.slice(5),
                        value: d.inbound,
                      }))}
                    />
                    <SimpleBarChart
                      title="Mensagens por dia (outbound)"
                      data={volume.data.messagesByDay.map((d) => ({
                        label: d.date.slice(5),
                        value: d.outbound,
                      }))}
                    />
                    <SimpleBarChart
                      title="Horários de pico (inbound)"
                      description="Distribuição horária de mensagens recebidas — horário de Brasília"
                      data={volume.data.peakHours.map((h) => ({
                        label: `${h.hour}h`,
                        value: h.count,
                      }))}
                    />
                  </div>
                  {volume.data.teamThroughput.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif text-lg">Throughput por operador</CardTitle>
                        <CardDescription>Respostas enviadas por usuário e dia</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Operador</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead className="text-right">Respostas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {volume.data.teamThroughput.slice(0, 20).map((row, i) => (
                              <TableRow key={`${row.userId}-${row.date}-${i}`}>
                                <TableCell>{row.userName ?? row.userId.slice(0, 8)}</TableCell>
                                <TableCell>{row.date}</TableCell>
                                <TableCell className="text-right">{row.replyCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="satisfaction" className="space-y-6">
              {satisfaction.isLoading ? (
                <Skeleton className="h-48" />
              ) : satisfaction.data ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="Nota média (CSAT)"
                      value={satisfaction.data.avgScore.toFixed(1)}
                    />
                    <MetricCard
                      title="Taxa de resposta"
                      value={formatPercent(satisfaction.data.responseRate)}
                    />
                    <MetricCard title="Prompts enviados" value={satisfaction.data.totalPrompts} />
                    <MetricCard title="Respostas" value={satisfaction.data.totalResponses} />
                  </div>
                  <SimpleBarChart
                    title="Nota média por tempo de resposta"
                    description="Bucket de delay entre prompt CSAT e resposta"
                    data={satisfaction.data.byDelayBucket.map((b) => ({
                      label: b.bucket,
                      value: Math.round(b.avgScore * 10) / 10,
                    }))}
                  />
                  <SimpleBarChart
                    title="Volume por bucket de delay"
                    data={satisfaction.data.byDelayBucket.map((b) => ({
                      label: b.bucket,
                      value: b.count,
                    }))}
                  />
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="traceability" className="space-y-6">
              <Tabs defaultValue="audit">
                <TabsList>
                  <TabsTrigger value="audit">Audit log</TabsTrigger>
                  <TabsTrigger value="events">Interaction events</TabsTrigger>
                </TabsList>
                <TabsContent value="audit">
                  {auditLog.isLoading ? (
                    <Skeleton className="h-48" />
                  ) : (
                    <TraceabilityTable
                      title="Audit log"
                      description={`${auditLog.data?.total ?? 0} registros no período`}
                      rows={(auditLog.data?.items ?? []).map((e) => ({
                        id: e.id,
                        when: e.createdAt,
                        type: e.action,
                        detail: `${e.entityName}${e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}`,
                        meta: e.userId ? `user ${e.userId.slice(0, 8)}` : undefined,
                      }))}
                    />
                  )}
                </TabsContent>
                <TabsContent value="events">
                  {interactionEvents.isLoading ? (
                    <Skeleton className="h-48" />
                  ) : (
                    <TraceabilityTable
                      title="Interaction events"
                      description={`${interactionEvents.data?.total ?? 0} eventos no período`}
                      rows={(interactionEvents.data?.items ?? []).map((e) => ({
                        id: e.id,
                        when: e.occurredAt,
                        type: e.eventType,
                        detail: [
                          e.aiProvider && `${e.aiProvider}/${e.aiModel ?? "?"}`,
                          e.messageId && `msg ${e.messageId.slice(0, 8)}`,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                        meta: e.patientId ? `patient ${e.patientId.slice(0, 8)}` : undefined,
                      }))}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="senders">
              <AdminSendersTable rows={senders.data ?? []} loading={senders.isLoading} />
            </TabsContent>

            <TabsContent value="comparison">
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
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function TenantMetricsTable({
  rows,
}: {
  rows: {
    tenantId: string;
    tenantName: string;
    totalCheckins: number;
    takenCount: number;
    missedCount: number;
    adherenceRate: number;
    activePatients: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Detalhe por organização</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organização</TableHead>
              <TableHead>Adesão</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Ativos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.tenantId}>
                <TableCell className="font-medium">{r.tenantName}</TableCell>
                <TableCell>{formatPercent(r.adherenceRate)}</TableCell>
                <TableCell>{r.totalCheckins}</TableCell>
                <TableCell>{r.activePatients}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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

function TraceabilityTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { id: string; when: string; type: string; detail: string; meta?: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead>Contexto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.when).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{row.detail || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.meta ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AdminRankingTable({
  title,
  rows,
  loading,
}: {
  title: string;
  rows?: {
    tenantName: string;
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
          r.tenantName,
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
            placeholder="Buscar organização, paciente ou status"
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
                <TableHead>Organização</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead>Check-ins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={5} message="Nenhum registro corresponde à busca." />
              )}
              {filtered.map((r) => (
                <TableRow key={`${r.tenantName}-${r.patientId}`}>
                  <TableCell className="text-muted-foreground">{r.tenantName}</TableCell>
                  <TableCell className="font-medium">{r.name ?? "Sem nome"}</TableCell>
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

function AdminSendersTable({
  rows,
  loading,
}: {
  rows: {
    tenantName: string;
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
          s.tenantName,
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
          <CardDescription>Números WhatsApp das organizações selecionadas</CardDescription>
        </div>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar organização, nome ou telefone"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum remetente ativo nas organizações selecionadas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ativos</TableHead>
                <TableHead>Check-ins</TableHead>
                <TableHead>Adesão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={6} message="Nenhum remetente corresponde à busca." />
              )}
              {filtered.map((s) => (
                <TableRow key={s.senderId}>
                  <TableCell className="text-muted-foreground">{s.tenantName}</TableCell>
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
