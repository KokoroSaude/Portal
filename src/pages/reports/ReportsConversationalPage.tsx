import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FeatureLocked } from "@/components/PageHeader";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatDateTime, formatPercent } from "@/lib/utils";

function ReportError({ error }: { error: unknown }) {
  if (error instanceof ApiClientError) {
    return <p className="text-destructive">{error.message}</p>;
  }
  return null;
}

export function ReportsConversationalPage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();

  async function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasQuality = hasFeature(FEATURE_KEYS.reportsConversationQuality);
  const hasRetention = hasFeature(FEATURE_KEYS.reportsRetentionChurn);
  const hasFunnel = hasFeature(FEATURE_KEYS.reportsOnboardingFunnel);
  const hasHandoffs = hasFeature(FEATURE_KEYS.reportsHandoffs);

  const hasAny = hasQuality || hasRetention || hasFunnel || hasHandoffs;

  const quality = useQuery({
    queryKey: ["conversation-quality-report", range],
    queryFn: () => api.getConversationQualityReport(token!, range.from, range.to),
    enabled: !!token && hasQuality,
  });

  const retention = useQuery({
    queryKey: ["retention-churn-report", range],
    queryFn: () => api.getRetentionChurnReport(token!, range.from, range.to),
    enabled: !!token && hasRetention,
  });

  const funnel = useQuery({
    queryKey: ["onboarding-funnel-report", range],
    queryFn: () => api.getOnboardingStepFunnelReport(token!, range.from, range.to),
    enabled: !!token && hasFunnel,
  });

  const handoffs = useQuery({
    queryKey: ["handoff-report", range],
    queryFn: () => api.getHandoffReport(token!, range.from, range.to),
    enabled: !!token && hasHandoffs,
  });

  const incidents = useQuery({
    queryKey: ["conversation-incidents-report", range],
    queryFn: () => api.getConversationIncidentsReport(token!, range.from, range.to),
    enabled: !!token && hasHandoffs,
  });

  if (!hasAny) {
    return (
      <FeatureLocked
        title="Relatórios conversacionais não disponíveis"
        description="Este recurso não está incluído no seu plano atual."
      />
    );
  }

  const defaultTab = hasQuality
    ? "quality"
    : hasRetention
      ? "retention"
      : hasFunnel
        ? "funnel"
        : "handoffs";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="flex h-auto flex-wrap gap-1">
        {hasQuality && <TabsTrigger value="quality">Scorecard</TabsTrigger>}
        {hasRetention && <TabsTrigger value="retention">Retenção</TabsTrigger>}
        {hasFunnel && <TabsTrigger value="funnel">Funil onboarding</TabsTrigger>}
        {hasHandoffs && <TabsTrigger value="handoffs">Handoffs</TabsTrigger>}
        {hasHandoffs && <TabsTrigger value="incidents">Incidentes</TabsTrigger>}
      </TabsList>

      {hasQuality && (
        <TabsContent value="quality" className="space-y-6">
          {quality.isError ? (
            <ReportError error={quality.error} />
          ) : quality.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : quality.data ? (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription>Qualidade conversacional</CardDescription>
                  <CardTitle className="flex items-center gap-3 font-serif text-3xl">
                    {quality.data.score}
                    <Badge variant="secondary">{quality.data.grade}</Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Texto inválido"
                  value={formatPercent(quality.data.invalidTextRate)}
                />
                <MetricCard
                  title="Menu + texto livre"
                  value={formatPercent(quality.data.menuFreeTextHandledRate)}
                />
                <MetricCard
                  title="Conclusão de escala"
                  value={formatPercent(quality.data.scaleCompletionAfterDeviationRate)}
                />
                <MetricCard
                  title="Passos onboarding"
                  value={formatPercent(quality.data.onboardingStepCompletionRate)}
                />
                <MetricCard
                  title="Handoff sem resolução 24h"
                  value={formatPercent(quality.data.handoffUnresolvedRate24h)}
                />
                <MetricCard
                  title="Retenção salva"
                  value={formatPercent(quality.data.retentionSaveRate)}
                />
                <MetricCard
                  title="Saída confusa (bot)"
                  value={formatPercent(quality.data.exitConfusedByBotRate)}
                />
              </div>
              {quality.data.byAgeBand.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Por faixa etária</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faixa</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Amostra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quality.data.byAgeBand.map((row) => (
                          <TableRow key={row.ageBand}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell>{row.score}</TableCell>
                            <TableCell>{row.sampleSize}</TableCell>
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
      )}

      {hasRetention && (
        <TabsContent value="retention" className="space-y-6">
          {retention.isError ? (
            <ReportError error={retention.error} />
          ) : retention.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : retention.data ? (
            <>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void api
                      .exportExitSurveysCsv(token!, range.from, range.to)
                      .then((blob) => downloadBlob(blob, "exit-surveys.csv"))
                  }
                >
                  Exportar CSV
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Interceptações" value={retention.data.interceptsStarted} />
                <MetricCard title="Salvos (pausa)" value={retention.data.savedPause} />
                <MetricCard title="Salvos (continuar)" value={retention.data.savedContinue} />
                <MetricCard title="Salvos (handoff)" value={retention.data.savedHandoff} />
                <MetricCard title="Opt-out pós-pesquisa" value={retention.data.optedOutAfterSurvey} />
                <MetricCard title="Taxa de salvamento" value={formatPercent(retention.data.saveRate)} />
              </div>
              {retention.data.exitReasons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Motivos de saída</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Participação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retention.data.exitReasons.map((row) => (
                          <TableRow key={row.reason}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell>{row.count}</TableCell>
                            <TableCell>{formatPercent(row.share)}</TableCell>
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
      )}

      {hasFunnel && (
        <TabsContent value="funnel" className="space-y-6">
          {funnel.isError ? (
            <ReportError error={funnel.error} />
          ) : funnel.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : funnel.data ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Funil por etapa</CardTitle>
                <CardDescription>Jornada de onboarding no período</CardDescription>
              </CardHeader>
              <CardContent>
                {funnel.data.steps.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados no período.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Entraram</TableHead>
                        <TableHead>Concluíram</TableHead>
                        <TableHead>Abandonaram</TableHead>
                        <TableHead>Drop-off</TableHead>
                        <TableHead>Tempo médio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funnel.data.steps.map((row) => (
                        <TableRow key={row.stepId}>
                          <TableCell>{row.stepLabel}</TableCell>
                          <TableCell>{row.entered}</TableCell>
                          <TableCell>{row.completed}</TableCell>
                          <TableCell>{row.abandoned}</TableCell>
                          <TableCell>{formatPercent(row.dropOffRate)}</TableCell>
                          <TableCell>{Math.round(row.avgMinutesInStep)} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      )}

      {hasHandoffs && (
        <>
          <TabsContent value="handoffs" className="space-y-6">
            {handoffs.isError ? (
              <ReportError error={handoffs.error} />
            ) : handoffs.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : handoffs.data ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard title="Solicitados" value={handoffs.data.requested} />
                  <MetricCard title="Micro-CSAT positivo" value={handoffs.data.microCsatPositive} />
                  <MetricCard title="Micro-CSAT negativo" value={handoffs.data.microCsatNegative} />
                  <MetricCard title="Acima do SLA" value={handoffs.data.unresolvedOverSla} />
                  <MetricCard
                    title="Resolução média"
                    value={`${Math.round(handoffs.data.avgResolutionMinutes)} min`}
                  />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Fila pendente</CardTitle>
                    <CardDescription>Handoffs aguardando atendimento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {handoffs.data.pending.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum handoff pendente.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Paciente</TableHead>
                            <TableHead>Solicitado</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Espera</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {handoffs.data.pending.map((row) => (
                            <TableRow key={`${row.patientId}-${row.requestedAt}`}>
                              <TableCell>
                                <Link
                                  to={`/pacientes/${row.patientId}`}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {row.patientName ?? "Sem nome"}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDateTime(row.requestedAt)}</TableCell>
                              <TableCell>{row.eventType}</TableCell>
                              <TableCell>{row.minutesWaiting} min</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            {incidents.isError ? (
              <ReportError error={incidents.error} />
            ) : incidents.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : incidents.data ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-serif text-lg">Incidentes conversacionais</CardTitle>
                    <CardDescription>
                      {incidents.data.total} incidente(s) no período
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void api
                        .exportConversationIncidentsCsv(token!, range.from, range.to)
                        .then((blob) => downloadBlob(blob, "conversation-incidents.csv"))
                    }
                  >
                    Exportar CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {incidents.data.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum incidente no período.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Quando</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Fluxo</TableHead>
                          <TableHead>Última mensagem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incidents.data.items.map((row) => (
                          <TableRow key={`${row.patientId}-${row.at}`}>
                            <TableCell>
                              <Link
                                to={`/pacientes/${row.patientId}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {row.patientName ?? "Sem nome"}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDateTime(row.at)}</TableCell>
                            <TableCell>{row.incidentType}</TableCell>
                            <TableCell>{row.flowLabel ?? "—"}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {row.lastPatientMessage ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
