import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import {
  MoriskyLevelChart,
  MoriskyTrendChart,
  MoriskyTriggerChart,
  TpbConstructChart,
  TpbTrendChart,
  TpbTriggerChart,
} from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportSectionNav } from "@/components/reports/ReportSectionNav";
import { resolveReportTab } from "@/lib/reportNavigation";
import { matchesGridSearch } from "@/lib/gridSearch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import {
  FEATURE_KEYS,
  MORISKY_LEVEL_LABELS,
  TPB_CONSTRUCT_LABELS,
  TPB_RISK_LABELS,
} from "@/lib/constants";
import { formatDate, formatPercent, maskPhone } from "@/lib/utils";

export function ReportsScalesPage() {
  const { token, hasFeature } = useAuth();
  const { tab, setTab, searchQuery } = useReportRange();
  const { from, to } = useReportApiRange();

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

  if (!hasFeature(FEATURE_KEYS.scalesMorisky) && !hasFeature(FEATURE_KEYS.scalesTpb)) {
    return (
      <FeatureLocked
        title="Relatórios de escalas não disponíveis"
        description="MMAS-8 e TCP não estão incluídos no seu plano atual."
      />
    );
  }

  const navItems = [
    { value: "morisky", label: "MMAS-8", hidden: !hasFeature(FEATURE_KEYS.scalesMorisky) },
    { value: "tpb", label: "TCP", hidden: !hasFeature(FEATURE_KEYS.scalesTpb) },
    { value: "intention-adherence", label: "Intenção → Adesão", hidden: !hasFeature(FEATURE_KEYS.scalesTpb) },
  ];
  const defaultTab = hasFeature(FEATURE_KEYS.scalesMorisky) ? "morisky" : "tpb";
  const activeTab = resolveReportTab(
    tab,
    defaultTab,
    navItems.filter((i) => !i.hidden).map((i) => i.value),
  );

  return (
    <div className="space-y-4">
      <ReportSectionNav items={navItems} value={activeTab} onChange={setTab} />

      {activeTab === "morisky" && hasFeature(FEATURE_KEYS.scalesMorisky) && (
        <div className="space-y-4">
          {morisky.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : morisky.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={from}
                  to={to}
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
                            {morisky.data.patientRanking.filter((row) => matchesGridSearch(searchQuery, row.patientName, row.phone, MORISKY_LEVEL_LABELS[row.level], row.score)).map((row) => (
                              <TableRow key={`${row.patientId}-${row.completedAt}`}>
                                <TableCell>
                                  <Link
                                    to={`/pacientes/${row.patientId}`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {row.patientName ?? maskPhone(row.phone, row.phoneLast4)}
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
                                  {formatDate(row.completedAt)}
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
                  Nenhuma avaliação MMAS-8 concluída no período.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {activeTab === "tpb" && hasFeature(FEATURE_KEYS.scalesTpb) && (
        <div className="space-y-4">
          {tpb.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : tpb.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={from}
                  to={to}
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
                <MetricCard title="Pacientes com risco" value={tpbRisk.data?.totalScored ?? "—"} />
              </div>

              {tpbRisk.data && tpbRisk.data.totalScored > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Risco preditivo na carteira</CardTitle>
                    <CardDescription>
                      Modelo de risco de não adesão — {tpbRisk.data.totalScored} paciente(s)
                      pontuados
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

              {tpb.data.psychometrics?.hasMultiItemScale &&
                tpb.data.psychometrics.constructs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Psicometria (Cronbach α)</CardTitle>
                    <CardDescription>
                      Confiabilidade interna por construto — escala multi-item v2/v3 (mín. 3 itens)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Construto</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead>Avaliações</TableHead>
                          <TableHead>α de Cronbach</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tpb.data.psychometrics.constructs.map((c) => (
                          <TableRow key={c.construct}>
                            <TableCell>
                              {TPB_CONSTRUCT_LABELS[c.construct] ?? c.construct}
                            </TableCell>
                            <TableCell>{c.itemCount}</TableCell>
                            <TableCell>{c.assessmentCount}</TableCell>
                            <TableCell>
                              {c.cronbachAlpha != null ? c.cronbachAlpha.toFixed(3) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                            {tpb.data.patientRanking.filter((row) => matchesGridSearch(searchQuery, row.patientName, row.phone, row.intentionScore)).map((row) => (
                              <TableRow key={`${row.patientId}-${row.completedAt}`}>
                                <TableCell>
                                  <Link
                                    to={`/pacientes/${row.patientId}`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {row.patientName ?? maskPhone(row.phone, row.phoneLast4)}
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
                                  {formatDate(row.completedAt)}
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
                  Nenhuma avaliação TCP concluída no período.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {activeTab === "intention-adherence" && hasFeature(FEATURE_KEYS.scalesTpb) && (
        <div className="space-y-4">
          {tpb.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : tpb.data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Pacientes com intenção + adesão"
                  value={tpb.data.intentionAdherence?.patientsWithBothMetrics ?? 0}
                />
                <MetricCard
                  title="Lacuna média intenção→adesão"
                  value={
                    tpb.data.intentionAdherence?.patientsWithBothMetrics
                      ? tpb.data.intentionAdherence.avgIntentionBehaviorGap.toFixed(2)
                      : "—"
                  }
                />
                <MetricCard
                  title="Correlação intenção × adesão 30d"
                  value={
                    tpb.data.intentionAdherence?.patientsWithBothMetrics
                      ? tpb.data.intentionAdherence.intentionAdherenceCorrelation.toFixed(2)
                      : "—"
                  }
                />
                <MetricCard
                  title="Alta lacuna (≥20%)"
                  value={
                    tpb.data.intentionAdherence?.patientsWithBothMetrics
                      ? `${tpb.data.intentionAdherence.highGapCount} (${formatPercent(tpb.data.intentionAdherence.highGapRate)})`
                      : "—"
                  }
                />
              </div>

              {tpb.data.intentionAdherence?.patientsWithBothMetrics ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif text-lg">Intenção vs adesão observada</CardTitle>
                      <CardDescription>
                        Lacuna = intenção normalizada (0–1) menos taxa de check-ins tomados no período.
                        Correlação de Pearson entre intenção TCP e adesão 30d por paciente.
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {tpb.data.patientRanking.filter((r) => r.intentionBehaviorGap != null).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif text-lg">Pacientes por lacuna</CardTitle>
                        <CardDescription>Maior lacuna = intenção alta e adesão baixa</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Paciente</TableHead>
                              <TableHead>Intenção</TableHead>
                              <TableHead>Adesão check-in</TableHead>
                              <TableHead>Lacuna</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...tpb.data.patientRanking]
                              .filter((row) => row.intentionBehaviorGap != null)
                              .sort((a, b) => (b.intentionBehaviorGap ?? 0) - (a.intentionBehaviorGap ?? 0))
                              .filter((row) =>
                                matchesGridSearch(
                                  searchQuery,
                                  row.patientName,
                                  row.phone,
                                  row.intentionScore,
                                  row.intentionBehaviorGap,
                                ),
                              )
                              .map((row) => (
                                <TableRow key={`${row.patientId}-gap`}>
                                  <TableCell>
                                    <Link
                                      to={`/pacientes/${row.patientId}`}
                                      className="font-medium text-primary hover:underline"
                                    >
                                      {row.patientName ?? maskPhone(row.phone, row.phoneLast4)}
                                    </Link>
                                  </TableCell>
                                  <TableCell>{row.intentionScore.toFixed(1)}/5</TableCell>
                                  <TableCell>
                                    {row.checkinAdherenceRate != null
                                      ? formatPercent(row.checkinAdherenceRate)
                                      : "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        (row.intentionBehaviorGap ?? 0) >= 0.2 ? "warning" : "secondary"
                                      }
                                    >
                                      {(row.intentionBehaviorGap ?? 0).toFixed(2)}
                                    </Badge>
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
                  Dados insuficientes no período — é necessário TCP concluído e check-ins no intervalo.
                </p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
