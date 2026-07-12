import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

export function PublicHealthDashboardPage() {
  const { token, hasFeature } = useAuth();
  const { hasModule } = useTenantSettings();

  const dashboard = useQuery({
    queryKey: ["public-health-dashboard"],
    queryFn: () => api.getPublicHealthDashboard(token!),
    enabled:
      !!token &&
      hasFeature(FEATURE_KEYS.populationHealthReports) &&
      hasModule("PopulationHealth"),
  });

  if (!hasFeature(FEATURE_KEYS.populationHealthReports)) {
    return (
      <FeatureLocked
        title="Painel saúde pública"
        description="Gestão populacional não está incluída no seu plano atual."
      />
    );
  }

  if (!hasModule("PopulationHealth")) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Painel saúde pública"
          description="Indicadores agregados para unidades e metas ODS 3."
        />
        <Card>
          <CardHeader>
            <CardTitle>Módulo não habilitado</CardTitle>
            <CardDescription>
              Peça ao administrador da plataforma para habilitar o módulo{" "}
              <strong>Gestão populacional</strong> nesta organização.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const ods = dashboard.data?.ods3;
  const odsProgress = ods
    ? Math.min(100, Math.round((ods.currentAdherenceRate / ods.adherenceRateTarget) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel saúde pública"
        description="Fila de retirada, adesão agregada e meta ODS 3 (adesão medicamentosa ≥ 80%)."
        actions={
          <Button variant="outline" asChild>
            <Link to="/configuracoes/saude-publica">Unidades CNES</Link>
          </Button>
        }
      />

      {dashboard.isLoading && <Skeleton className="h-48 w-full" />}

      {dashboard.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Pacientes ativos" value={dashboard.data.activePatients} />
            <MetricCard
              title="Adesão média (30d)"
              value={formatPercent(dashboard.data.avgAdherence30d)}
            />
            <MetricCard title="Unidades CNES" value={dashboard.data.unitsConfigured} />
            <MetricCard
              title="Retiradas concluídas hoje"
              value={dashboard.data.pickupQueue.completedToday}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Fila de retirada</CardTitle>
                <CardDescription>Status operacional das retiradas SUS</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  title="Aguardando estoque"
                  value={dashboard.data.pickupQueue.awaitingPickup}
                />
                <MetricCard title="Na fila" value={dashboard.data.pickupQueue.inQueue} />
                <MetricCard
                  title="Concluídas hoje"
                  value={dashboard.data.pickupQueue.completedToday}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Meta ODS 3 — Adesão</CardTitle>
                <CardDescription>
                  Alvo {ods ? formatPercent(ods.adherenceRateTarget) : "80%"} · indicador placeholder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ods && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Taxa atual</span>
                      <span className="font-medium">{formatPercent(ods.currentAdherenceRate)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${odsProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gap para meta: {formatPercent(ods.gapToTarget)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
