import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SimpleBarChart } from "@/components/reports/ReportCharts";
import { MetricCard } from "@/components/reports/AdminReportsShared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

const OPERATIONS_TABS = ["operacao", "volume", "satisfacao"] as const;
type OperationsTab = (typeof OPERATIONS_TABS)[number];

function isOperationsTab(value: string | null): value is OperationsTab {
  return OPERATIONS_TABS.includes(value as OperationsTab);
}

export function AdminReportsOperationsPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: OperationsTab = isOperationsTab(tabParam) ? tabParam : "operacao";

  function setActiveTab(tab: OperationsTab) {
    if (tab === "operacao") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  }

  const operations = useQuery({
    queryKey: ["admin-operations", range, tenantFilter],
    queryFn: () => api.adminGetOperationsReport(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const volume = useQuery({
    queryKey: ["admin-volume", range, tenantFilter],
    queryFn: () => api.adminGetMessageVolumeMetrics(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const satisfaction = useQuery({
    queryKey: ["admin-satisfaction", range, tenantFilter],
    queryFn: () => api.adminGetSatisfactionMetrics(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const latency = useQuery({
    queryKey: ["admin-latency", range, tenantFilter],
    queryFn: () => api.adminGetOperationalLatencyMetrics(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Operação</h2>
        <p className="text-sm text-muted-foreground">
          Lembretes, volume de mensagens, satisfação e latência clínica.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OperationsTab)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="satisfacao">Satisfação</TabsTrigger>
        </TabsList>

        <TabsContent value="operacao" className="space-y-6">
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

        <TabsContent value="satisfacao" className="space-y-6">
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
      </Tabs>
    </div>
  );
}
