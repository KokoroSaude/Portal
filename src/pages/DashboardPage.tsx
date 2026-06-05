import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Users, XCircle } from "lucide-react";
import { CheckinsByHourChart } from "@/components/reports/ReportCharts";
import { FeatureLocked, PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-serif text-3xl">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { token, hasFeature } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["adherence-report"],
    queryFn: () => api.getAdherenceReport(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsBasic),
  });

  if (!hasFeature(FEATURE_KEYS.reportsBasic)) {
    return (
      <>
        <PageHeader title="Dashboard" description="Visão geral de adesão e pacientes ativos" />
        <FeatureLocked
          title="Dashboard indisponível"
          description="Faça upgrade do plano para acessar métricas de adesão e check-ins."
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        Não foi possível carregar o relatório de adesão.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Últimos 30 dias ·{" "}
          <Link to="/relatorios" className="text-primary hover:underline">
            ver relatórios completos
          </Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de adesão"
          value={formatPercent(data.adherenceRate)}
          description={`${data.takenCount} tomados de ${data.totalCheckins} check-ins`}
          icon={Activity}
        />
        <StatCard title="Pacientes ativos" value={data.activePatients} icon={Users} />
        <StatCard title="Check-ins tomados" value={data.takenCount} icon={CheckCircle2} />
        <StatCard title="Check-ins perdidos" value={data.missedCount} icon={XCircle} />
      </div>

      {hasFeature(FEATURE_KEYS.reportsCharts) ? (
        <CheckinsByHourChart data={data.checkinsByHour} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Check-ins por hora</CardTitle>
            <CardDescription>Gráficos disponíveis no plano Premium</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/relatorios" className="text-sm text-primary hover:underline">
              Ver relatórios →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
