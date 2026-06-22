import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PickupFeatureLocked } from "@/components/farmacia/PickupFeatureLocked";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent, formatDateTime } from "@/lib/utils";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function FarmaciaRelatoriosPage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [groupBy, setGroupBy] = useState("medication");
  const [procurementWeeks, setProcurementWeeks] = useState(4);
  const range = useMemo(() => defaultRange(), []);
  const { pickupAccess: pickupEnabled } = useTenantSettings();

  const attendance = useQuery({
    queryKey: ["pickup-attendance", range.from, range.to, groupBy],
    queryFn: () =>
      api.getPickupAttendanceReport(token!, {
        from: range.from,
        to: range.to,
        groupBy,
      }),
    enabled: !!token && pickupEnabled && hasFeature(FEATURE_KEYS.reportsBasic),
  });

  const funnel = useQuery({
    queryKey: ["pickup-funnel", range.from, range.to],
    queryFn: () =>
      api.getPickupOperationsFunnel(token!, { from: range.from, to: range.to }),
    enabled: !!token && pickupEnabled && hasFeature(FEATURE_KEYS.reportsOperations),
  });

  const forecast = useQuery({
    queryKey: ["pickup-forecast"],
    queryFn: () => api.getPickupDemandForecast(token!, 4),
    enabled: !!token && pickupEnabled && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const procurementSuggestions = useQuery({
    queryKey: ["procurement-suggestions", procurementWeeks],
    queryFn: () => api.getProcurementSuggestions(token!, procurementWeeks),
    enabled: !!token && pickupEnabled && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const procurementExports = useQuery({
    queryKey: ["procurement-exports"],
    queryFn: () => api.listProcurementExports(token!),
    enabled: !!token && pickupEnabled && hasFeature(FEATURE_KEYS.reportsAdvanced),
  });

  const exportProcurementMutation = useMutation({
    mutationFn: () => api.exportProcurementCsv(token!, procurementWeeks),
    onSuccess: ({ blob, fileName }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ["procurement-exports"] });
      toast.success("CSV exportado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao exportar CSV"),
  });

  if (!pickupEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Relatórios de retirada" description="Comparecimento, funil e demanda" />
        <PickupFeatureLocked />
      </div>
    );
  }

  const attendanceChart = (attendance.data?.slices ?? []).slice(0, 12).map((s) => ({
    name: s.label.length > 18 ? `${s.label.slice(0, 16)}…` : s.label,
    comparecimento: Math.round(s.attendanceRate * 100),
    avisados: s.notified,
    concluidos: s.completed,
    faltas: s.noShow,
  }));

  const funnelChart = funnel.data
    ? [
        {
          etapa: "Aviso → Chegada",
          minutos: funnel.data.medianNotifyToArriveMinutes ?? 0,
        },
        {
          etapa: "Chegada → Conclusão",
          minutos: funnel.data.medianArriveToCompleteMinutes ?? 0,
        },
        {
          etapa: "Aviso → Conclusão",
          minutos: funnel.data.medianNotifyToCompleteMinutes ?? 0,
        },
      ]
    : [];

  const forecastChart = (forecast.data ?? []).slice(0, 10).map((f) => ({
    name: f.medicationName.length > 16 ? `${f.medicationName.slice(0, 14)}…` : f.medicationName,
    unidades: f.forecastUnits,
    confianca: f.confidence,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios de retirada"
        description="Últimos 30 dias — comparecimento, gargalos operacionais e previsão de demanda"
      />

      {hasFeature(FEATURE_KEYS.reportsBasic) && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-lg">Taxa de comparecimento</CardTitle>
              <CardDescription>Por medicamento, dia da semana ou bairro</CardDescription>
            </div>
            <div className="w-48 space-y-1">
              <Label>Agrupar por</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medicamento</SelectItem>
                  <SelectItem value="weekday">Dia da semana</SelectItem>
                  <SelectItem value="patientzone">Bairro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {attendance.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : attendanceChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={attendanceChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avisados" fill="hsl(var(--muted-foreground))" name="Avisados" />
                  <Bar yAxisId="left" dataKey="concluidos" fill="hsl(var(--primary))" name="Concluídos" />
                  <Bar yAxisId="right" dataKey="comparecimento" fill="hsl(var(--chart-2))" name="% comparecimento" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {attendance.data && attendance.data.slices.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Taxa média:{" "}
                {formatPercent(
                  attendance.data.slices.reduce((a, s) => a + s.attendanceRate, 0) /
                    attendance.data.slices.length,
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {hasFeature(FEATURE_KEYS.reportsOperations) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Funil operacional</CardTitle>
            <CardDescription>
              Mediana de tempo entre etapas (amostra: {funnel.data?.sampleSize ?? 0} ordens)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {funnel.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : funnelChart.every((f) => f.minutos === 0) ? (
              <p className="text-sm text-muted-foreground">Dados insuficientes para o funil.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit=" min" />
                  <YAxis type="category" dataKey="etapa" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${Math.round(v)} min`, "Mediana"]} />
                  <Bar dataKey="minutos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {hasFeature(FEATURE_KEYS.reportsAdvanced) && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-lg">Sugestão de compras</CardTitle>
              <CardDescription>Exportação CSV para abastecimento (CATMAT)</CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-28 space-y-1">
                <Label>Semanas</Label>
                <Select
                  value={String(procurementWeeks)}
                  onValueChange={(v) => setProcurementWeeks(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8].map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => exportProcurementMutation.mutate()}
                disabled={exportProcurementMutation.isPending}
              >
                <Download className="mr-2 size-4" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {procurementSuggestions.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (procurementSuggestions.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem sugestões no horizonte selecionado.</p>
            ) : (
              <ul className="space-y-2">
                {(procurementSuggestions.data ?? []).slice(0, 8).map((item) => (
                  <li
                    key={item.medicationId}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.medicationName}</p>
                      <p className="text-xs text-muted-foreground">
                        CATMAT {item.catmatCode ?? "—"} · fila {item.waitlistCount}
                      </p>
                    </div>
                    <span className="text-muted-foreground">
                      {item.forecastUnits} un. ({item.confidence})
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {(procurementExports.data ?? []).length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Histórico de exportações</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(procurementExports.data ?? []).slice(0, 5).map((exp) => (
                    <li key={exp.id}>
                      {formatDateTime(exp.exportedAt)} — {exp.fileName ?? "csv"} ({exp.lineCount}{" "}
                      linhas, {exp.weeksHorizon} sem.)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasFeature(FEATURE_KEYS.reportsAdvanced) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Previsão de demanda</CardTitle>
            <CardDescription>Próximas 4 semanas por medicamento</CardDescription>
          </CardHeader>
          <CardContent>
            {forecast.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : forecastChart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem previsão disponível.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={forecastChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="unidades"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Unidades previstas"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
