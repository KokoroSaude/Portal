import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { MetricCard } from "@/components/reports/ReportsShared";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
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
import { useReportApiRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { CLINICAL_PRIORITY_TIER_LABELS, FEATURE_KEYS, TPB_RISK_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

const CHART_COLORS = ["#E85F5F", "#F4A261", "#2A9D8F", "#457B9D", "#9B5DE5"];

export function ReportsPopulationPage() {
  const { token, hasFeature } = useAuth();
  const { from, to } = useReportApiRange();

  const report = useQuery({
    queryKey: ["population-health-report"],
    queryFn: () => api.getPopulationHealthReport(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.populationHealthReports),
  });

  if (!hasFeature(FEATURE_KEYS.populationHealthReports)) {
    return (
      <FeatureLocked
        title="Relatório populacional"
        description="Gestão populacional não está incluída no seu plano atual."
      />
    );
  }

  const riskChart = (report.data?.tpbRiskDistribution ?? []).map((r) => ({
    name: TPB_RISK_LABELS[r.label] ?? r.label,
    value: r.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatório populacional"
        description="Visão de cohort: adesão média, distribuição de risco TCP e recortes por medicamento, prioridade clínica e bairro."
      />

      {report.isLoading && <Skeleton className="h-48 w-full" />}

      {report.data && (
        <>
          {token && (
            <ReportAiInsightCard token={token} from={from} to={to} variant="population-health" />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Pacientes ativos" value={report.data.totalPatients} />
            <MetricCard
              title="Adesão média (30d)"
              value={formatPercent(report.data.avgAdherence30d)}
            />
            <MetricCard
              title="Com score de risco TCP"
              value={report.data.tpbRiskDistribution.reduce((s, r) => s + r.count, 0)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Distribuição de risco TCP</CardTitle>
                <CardDescription>Alto / Médio / Baixo (último score por paciente)</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {riskChart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados de risco TCP.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {riskChart.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Adesão por medicamento</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {(report.data.byMedication ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem recorte por medicamento.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data.byMedication.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                      <Tooltip formatter={(v: number) => formatPercent(v)} />
                      <Bar dataKey="avgAdherence30d" fill="#E85F5F" name="Adesão 30d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <BreakdownTable
            title="Por prioridade clínica"
            rows={report.data.byClinicalPriorityTier}
            labelFn={(k) => CLINICAL_PRIORITY_TIER_LABELS[k] ?? k}
          />
          <BreakdownTable title="Por bairro" rows={report.data.byNeighborhood} />
        </>
      )}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  labelFn,
}: {
  title: string;
  rows: { key: string; count: number; avgAdherence30d: number | null }[];
  labelFn?: (key: string) => string;
}) {
  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Pacientes</TableHead>
              <TableHead>Adesão 30d</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{labelFn ? labelFn(row.key) : row.key || "—"}</TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>
                  {row.avgAdherence30d != null ? formatPercent(row.avgAdherence30d) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
