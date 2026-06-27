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
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import {
  FEATURE_KEYS,
  MORISKY_LEVEL_LABELS,
  TPB_CONSTRUCT_LABELS,
  TPB_RISK_LABELS,
} from "@/lib/constants";
import { formatPercent, maskPhone } from "@/lib/utils";

export function ReportsScalesPage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();

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

  if (!hasFeature(FEATURE_KEYS.scalesMorisky) && !hasFeature(FEATURE_KEYS.scalesTpb)) {
    return (
      <FeatureLocked
        title="Relatórios de escalas não disponíveis"
        description="MMAS-8 e TCP não estão incluídos no seu plano atual."
      />
    );
  }

  return (
    <Tabs defaultValue={hasFeature(FEATURE_KEYS.scalesMorisky) ? "morisky" : "tpb"}>
      <TabsList className="flex h-auto flex-wrap gap-1">
        {hasFeature(FEATURE_KEYS.scalesMorisky) && (
          <TabsTrigger value="morisky">MMAS-8</TabsTrigger>
        )}
        {hasFeature(FEATURE_KEYS.scalesTpb) && <TabsTrigger value="tpb">TCP</TabsTrigger>}
      </TabsList>

      {hasFeature(FEATURE_KEYS.scalesMorisky) && (
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
                  Nenhuma avaliação MMAS-8 concluída no período.
                </p>
              )}
            </>
          ) : null}
        </TabsContent>
      )}

      {hasFeature(FEATURE_KEYS.scalesTpb) && (
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
                  Nenhuma avaliação TCP concluída no período.
                </p>
              )}
            </>
          ) : null}
        </TabsContent>
      )}
    </Tabs>
  );
}
