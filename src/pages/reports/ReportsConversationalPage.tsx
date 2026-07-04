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
import { ReportSectionNav } from "@/components/reports/ReportSectionNav";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { resolveReportTab } from "@/lib/reportNavigation";
import { matchesGridSearch } from "@/lib/gridSearch";
import { MessageContentSourceBadge } from "@/components/messages/MessageContentSourceBadge";
import { formatDateTime, formatPercent } from "@/lib/utils";

function ReportError({ error }: { error: unknown }) {
  if (error instanceof ApiClientError) {
    return <p className="text-destructive">{error.message}</p>;
  }
  return null;
}

export function ReportsConversationalPage() {
  const { token, hasFeature } = useAuth();
  const { tab, setTab, searchQuery } = useReportRange();
  const { from, to } = useReportApiRange();

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
  const hasMessageSources = hasFeature(FEATURE_KEYS.reportsBasic);

  const hasAny = hasQuality || hasRetention || hasFunnel || hasHandoffs || hasMessageSources;

  const quality = useQuery({
    queryKey: ["conversation-quality-report", from, to],
    queryFn: () => api.getConversationQualityReport(token!, from, to),
    enabled: !!token && hasQuality,
  });

  const retention = useQuery({
    queryKey: ["retention-churn-report", from, to],
    queryFn: () => api.getRetentionChurnReport(token!, from, to),
    enabled: !!token && hasRetention,
  });

  const funnel = useQuery({
    queryKey: ["onboarding-funnel-report", from, to],
    queryFn: () => api.getOnboardingStepFunnelReport(token!, from, to),
    enabled: !!token && hasFunnel,
  });

  const handoffs = useQuery({
    queryKey: ["handoff-report", from, to],
    queryFn: () => api.getHandoffReport(token!, from, to),
    enabled: !!token && hasHandoffs,
  });

  const incidents = useQuery({
    queryKey: ["conversation-incidents-report", from, to],
    queryFn: () => api.getConversationIncidentsReport(token!, from, to),
    enabled: !!token && hasHandoffs,
  });

  const messageSources = useQuery({
    queryKey: ["message-content-sources-report", from, to],
    queryFn: () => api.getMessageContentSourceReport(token!, from, to),
    enabled: !!token && hasMessageSources,
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
    : hasMessageSources
      ? "message-sources"
      : hasRetention
        ? "retention"
        : hasFunnel
          ? "funnel"
          : "handoffs";

  const navItems = [
    { value: "quality", label: "Scorecard", hidden: !hasQuality },
    { value: "retention", label: "Retenção", hidden: !hasRetention },
    { value: "funnel", label: "Funil onboarding", hidden: !hasFunnel },
    { value: "handoffs", label: "Handoffs", hidden: !hasHandoffs },
    { value: "incidents", label: "Incidentes", hidden: !hasHandoffs },
    { value: "message-sources", label: "Origem IA", hidden: !hasMessageSources },
  ];
  const activeTab = resolveReportTab(
    tab,
    defaultTab,
    navItems.filter((i) => !i.hidden).map((i) => i.value),
  );

  return (
    <div className="space-y-4">
      <ReportSectionNav items={navItems} value={activeTab} onChange={setTab} />

      {activeTab === "quality" && hasQuality && (
        <div className="space-y-4">
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
        </div>
      )}

      {activeTab === "retention" && hasRetention && (
        <div className="space-y-4">
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
                      .exportExitSurveysCsv(token!, from, to)
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
        </div>
      )}

      {activeTab === "funnel" && hasFunnel && (
        <div className="space-y-4">
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
        </div>
      )}

      {activeTab === "handoffs" && hasHandoffs && (
        <div className="space-y-4">
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
                          {handoffs.data.pending
                            .filter((row) =>
                              matchesGridSearch(
                                searchQuery,
                                row.patientName,
                                row.eventType,
                                row.minutesWaiting,
                              ),
                            )
                            .map((row) => (
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
        </div>
      )}

      {activeTab === "incidents" && hasHandoffs && (
        <div className="space-y-4">
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
                        .exportConversationIncidentsCsv(token!, from, to)
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
                        {incidents.data.items
                          .filter((row) =>
                            matchesGridSearch(
                              searchQuery,
                              row.patientName,
                              row.incidentType,
                              row.flowLabel,
                              row.lastPatientMessage,
                            ),
                          )
                          .map((row) => (
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
        </div>
      )}

      {activeTab === "message-sources" && hasMessageSources && (
        <div className="space-y-4">
          {messageSources.isError ? (
            <ReportError error={messageSources.error} />
          ) : messageSources.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : messageSources.data ? (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription>Mensagens enviadas no período</CardDescription>
                  <CardTitle className="font-serif text-3xl">
                    {messageSources.data.totalOutbound.toLocaleString("pt-BR")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {messageSources.data.totalWithAi.toLocaleString("pt-BR")} com origem{" "}
                    <strong>IA</strong> ({formatPercent(
                      messageSources.data.totalOutbound === 0
                        ? 0
                        : messageSources.data.totalWithAi / messageSources.data.totalOutbound,
                    )}
                    )
                  </p>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Por origem</CardTitle>
                  <CardDescription>
                    IA = LLM · Regras = personalização determinística · Template = texto fixo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messageSources.data.bySource.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada no período.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Origem</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Participação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messageSources.data.bySource.map((row) => (
                          <TableRow key={row.source}>
                            <TableCell>
                              <MessageContentSourceBadge source={row.source} />
                              <span className="ml-2">{row.label}</span>
                            </TableCell>
                            <TableCell>{row.count.toLocaleString("pt-BR")}</TableCell>
                            <TableCell>{formatPercent(row.share)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {messageSources.data.byTemplate.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Por template (top 20)</CardTitle>
                    <CardDescription>
                      Quantas vezes cada template foi enviado e com qual origem predominante.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>IA</TableHead>
                          <TableHead>Regras</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Outros</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messageSources.data.byTemplate.map((row) => (
                          <TableRow key={row.templateKey}>
                            <TableCell className="max-w-xs">
                              <p className="font-medium">{row.templateLabel}</p>
                              <p className="text-xs text-muted-foreground">{row.templateKey}</p>
                            </TableCell>
                            <TableCell>{row.total}</TableCell>
                            <TableCell>{row.aiCount}</TableCell>
                            <TableCell>{row.rulesCount}</TableCell>
                            <TableCell>{row.templateCount}</TableCell>
                            <TableCell>{row.otherCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
