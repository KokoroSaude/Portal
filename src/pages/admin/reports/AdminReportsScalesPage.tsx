import { useQuery } from "@tanstack/react-query";
import {
  MoriskyLevelChart,
  MoriskyTrendChart,
  MoriskyTriggerChart,
} from "@/components/reports/ReportCharts";
import {
  AdminMoriskyPatientRankingTable,
  AdminMoriskyTriggerTable,
  MetricCard,
} from "@/components/reports/AdminReportsShared";
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
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

export function AdminReportsScalesPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();

  const morisky = useQuery({
    queryKey: ["admin-morisky", range, tenantFilter],
    queryFn: () => api.adminGetMoriskyReport(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Escalas</h2>
        <p className="text-sm text-muted-foreground">
          Avaliações Morisky (MMAS-8) consolidadas no período.
        </p>
      </div>

      {morisky.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : morisky.data ? (
        <>
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

          {morisky.data.totalAssessments > 0 && (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">Check-in vs Morisky</CardTitle>
                  <CardDescription>
                    Comparação das médias consolidadas no período
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Adesão check-in</p>
                    <p className="font-serif text-2xl">
                      {formatPercent(morisky.data.checkinAdherenceRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score Morisky normalizado</p>
                    <p className="font-serif text-2xl">
                      {formatPercent(morisky.data.avgNormalizedScore)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <MoriskyTrendChart data={morisky.data.trend} />
                <MoriskyLevelChart data={morisky.data.byLevel} />
                {morisky.data.byTrigger.length > 0 && (
                  <MoriskyTriggerChart data={morisky.data.byTrigger} />
                )}
              </div>

              {morisky.data.byTrigger.length > 0 && (
                <AdminMoriskyTriggerTable rows={morisky.data.byTrigger} />
              )}
            </>
          )}

          {morisky.data.byTenant.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Por organização</CardTitle>
                <CardDescription>Avaliações Morisky no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organização</TableHead>
                      <TableHead>Avaliações</TableHead>
                      <TableHead>Score médio</TableHead>
                      <TableHead>Baixa adesão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {morisky.data.byTenant.map((row) => (
                      <TableRow key={row.tenantId}>
                        <TableCell className="font-medium">{row.tenantName}</TableCell>
                        <TableCell>{row.totalAssessments}</TableCell>
                        <TableCell>{formatPercent(row.avgNormalizedScore)}</TableCell>
                        <TableCell>{row.lowCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {morisky.data.patientRanking.length > 0 && (
            <AdminMoriskyPatientRankingTable rows={morisky.data.patientRanking} />
          )}

          {morisky.data.totalAssessments === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação Morisky concluída no período para as organizações selecionadas.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
