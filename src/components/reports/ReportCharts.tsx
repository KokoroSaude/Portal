import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART, DOW_LABELS, FUNNEL_COLORS } from "./chartTheme";
import { MORISKY_LEVEL_LABELS, MORISKY_TRIGGER_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import type {
  AdherenceReport,
  AdherenceTrendPoint,
  MoriskyLevelCount,
  MoriskyTrendPoint,
  MoriskyTriggerCount,
  PatientFunnelSegment,
} from "@/types/api";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2 text-xs shadow-soft">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value <= 1 ? formatPercent(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function AdherenceTrendChart({ data }: { data: AdherenceTrendPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
    ratePct: Math.round(d.rate * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Evolução da adesão</CardTitle>
        <CardDescription>Taxa diária de check-ins tomados</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="ratePct"
                name="Adesão"
                stroke={CHART.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CheckinsByHourChart({ data }: { data: AdherenceReport["checkinsByHour"] }) {
  const chartData = data.map((h) => ({
    hour: `${h.hour}h`,
    Tomados: h.taken,
    Perdidos: h.missed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Check-ins por hora</CardTitle>
        <CardDescription>Distribuição no horário de Brasília</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Tomados" fill={CHART.taken} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Perdidos" fill={CHART.missed} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ResponseByDayChart({ data }: { data: AdherenceReport["avgResponseByDay"] }) {
  const chartData = data.map((d) => ({
    day: DOW_LABELS[d.dayOfWeek] ?? d.dayOfWeek,
    minutos: Math.round(d.avgResponseSeconds / 60),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Tempo médio de resposta</CardTitle>
        <CardDescription>Minutos até responder, por dia da semana</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="day" width={36} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="minutos" name="Minutos" fill={CHART.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function EngagementBarChart({
  title,
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: { groupLabel: string; responseRate: number; sent: number }[];
}) {
  const chartData = rows.slice(0, 8).map((r) => ({
    name: r.groupLabel.length > 18 ? `${r.groupLabel.slice(0, 16)}…` : r.groupLabel,
    taxa: Math.round(r.responseRate * 100),
    enviados: r.sent,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="taxa" name="Taxa resposta" fill={CHART.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function PatientFunnelChart({ segments }: { segments: PatientFunnelSegment[] }) {
  const chartData = segments.map((s) => ({
    name: s.label,
    value: s.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Funil de pacientes</CardTitle>
        <CardDescription>Distribuição atual por status</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function MoriskyLevelChart({ data }: { data: MoriskyLevelCount[] }) {
  const chartData = data.map((d) => ({
    label: MORISKY_LEVEL_LABELS[d.level] ?? d.level,
    value: d.count,
  }));

  return (
    <SimpleBarChart
      title="Distribuição por nível"
      description="Classificação de adesão medicamentosa (MMAS)"
      data={chartData}
      name="Avaliações"
    />
  );
}

export function MoriskyTrendChart({ data }: { data: MoriskyTrendPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
    scorePct: Math.round(d.avgNormalizedScore * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Evolução Morisky</CardTitle>
        <CardDescription>Score normalizado médio por dia</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="scorePct"
                name="Score normalizado"
                stroke={CHART.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function MoriskyTriggerChart({ data }: { data: MoriskyTriggerCount[] }) {
  const chartData = data.map((d) => ({
    label: MORISKY_TRIGGER_LABELS[d.trigger] ?? d.trigger,
    value: d.count,
    avgScore: Math.round(d.avgNormalizedScore * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Avaliações por gatilho</CardTitle>
        <CardDescription>Quantidade e score médio por tipo de disparo</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="value" name="Avaliações" fill={CHART.primary} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgScore" name="Score médio" fill={CHART.muted} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SimpleBarChart({
  title,
  description,
  data,
  dataKey,
  name,
}: {
  title: string;
  description?: string;
  data: { label: string; value: number }[];
  dataKey?: string;
  name?: string;
}) {
  const key = dataKey ?? "value";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey={key} name={name ?? "Valor"} fill={CHART.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
