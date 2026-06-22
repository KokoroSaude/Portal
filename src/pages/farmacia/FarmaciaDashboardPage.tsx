import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardList,
  Package,
  ShieldAlert,
  Users,
  UserCheck,
} from "lucide-react";
import { PickupFeatureLocked } from "@/components/farmacia/PickupFeatureLocked";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { PICKUP_ORDER_STATUS_LABELS } from "@/lib/constants";
import { canAccessPickup } from "@/lib/gov-pharmacy";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

const ANOMALY_LABELS: Record<string, string> = {
  DuplicateDispenseInterval: "Dispensação duplicada",
  PasswordReuse: "Reuso de senha",
  DelegateHighVolume: "Alto volume por responsável",
  IntervalSusBypassAttempt: "Tentativa de bypass SUS",
  CriticalWaitlistShortage: "Fila crônica crítica",
  BatchNearExpiry: "Lote próximo do vencimento",
};

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

export function FarmaciaDashboardPage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(token!),
    enabled: !!token,
  });

  const pickupEnabled = canAccessPickup(hasFeature, settings);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["pickup-dashboard"],
    queryFn: () => api.getPickupDashboard(token!),
    enabled: !!token && pickupEnabled,
    refetchInterval: 30_000,
  });

  const { data: insights } = useQuery({
    queryKey: ["pickup-insights"],
    queryFn: () => api.getPickupStockRiskInsights(token!, 7),
    enabled: !!token && pickupEnabled,
    refetchInterval: 60_000,
  });

  const { data: anomalies } = useQuery({
    queryKey: ["pickup-anomalies"],
    queryFn: () => api.listPickupAnomalies(token!),
    enabled: !!token && pickupEnabled,
    refetchInterval: 60_000,
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: string) => api.dismissPickupAnomaly(token!, alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickup-anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-dashboard"] });
      toast.success("Alerta dispensado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao dispensar alerta"),
  });

  if (!pickupEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Farmácia" description="Operação de retirada de medicamentos" />
        <PickupFeatureLocked />
      </div>
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

  if (error || !dashboard) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        Não foi possível carregar o painel de retirada.
      </div>
    );
  }

  const criticalWaitlist = dashboard.waitlistAlerts.filter((w) => w.isCritical);
  const openAnomalies = anomalies ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Farmácia"
        description="Painel operacional de retirada e estoque"
        actions={
          <Link to="/farmacia/retiradas" className="text-sm text-primary hover:underline">
            Ver fila do dia →
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aguardando retirada"
          value={dashboard.awaitingPickupCount}
          icon={Users}
        />
        <StatCard title="No balcão" value={dashboard.arrivedCount} icon={UserCheck} />
        <StatCard
          title="Lotes ativos"
          value={dashboard.activeBatches.length}
          icon={Package}
        />
        <StatCard
          title="Ordens hoje"
          value={dashboard.todayOrders.length}
          icon={ClipboardList}
        />
      </div>

      {(dashboard.openAnomalyCount > 0 || openAnomalies.length > 0) && (
        <Card className="border-rose-300/60 bg-rose-50/40 dark:bg-rose-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-rose-800 dark:text-rose-200">
              <ShieldAlert className="size-4" />
              Anomalias para revisar
            </CardTitle>
            <CardDescription>
              {dashboard.openAnomalyCount} alerta(s) aberto(s) — dispense após verificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {openAnomalies.slice(0, 5).map((alert) => (
                <li
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {ANOMALY_LABELS[alert.type] ?? alert.type}
                      {alert.patientName ? ` — ${alert.patientName}` : ""}
                    </p>
                    {alert.details && (
                      <p className="text-xs text-muted-foreground">{alert.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(alert.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissMutation.mutate(alert.id)}
                    disabled={dismissMutation.isPending}
                  >
                    Revisar
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {criticalWaitlist.length > 0 && (
        <Card className="border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
              <AlertTriangle className="size-4" />
              Alertas críticos — fila crônica
            </CardTitle>
            <CardDescription>
              Medicamentos com fila acima do limite configurado (
              {settings?.pickupCriticalWaitlistThreshold ?? 20} pacientes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {criticalWaitlist.map((item) => (
                <li
                  key={item.medicationId}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <span className="font-medium">{item.medicationName}</span>
                  <Badge variant="warning">{item.activeCount} na fila</Badge>
                </li>
              ))}
            </ul>
            <Link
              to="/farmacia/fila-cronica"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Gerenciar fila crônica →
            </Link>
          </CardContent>
        </Card>
      )}

      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Insights de estoque</CardTitle>
            <CardDescription>Próximos {insights.horizonDays} dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{insights.summary}</p>
            {insights.stockRisk.length > 0 && (
              <ul className="space-y-2">
                {insights.stockRisk.slice(0, 5).map((item) => (
                  <li
                    key={item.medicationId}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{item.medicationName}</span>
                    <span className="text-muted-foreground">
                      {item.patientsAtRisk} paciente(s) em risco
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Lotes em estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.activeBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lote ativo.</p>
            ) : (
              dashboard.activeBatches.map((batch) => (
                <div key={batch.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{batch.medicationName}</p>
                    <Badge variant="outline">{batch.status}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {batch.quantityAllocated}/{batch.quantityAvailable} alocados · reserva{" "}
                    {batch.emergencyReserveRemaining}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Ordens recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.todayOrders.slice(0, 8).map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{order.patientName ?? "Paciente"}</p>
                  <p className="text-muted-foreground">{order.medicationName}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {PICKUP_ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Badge>
                  {order.queuePassword && (
                    <p className="mt-1 font-mono text-xs">{order.queuePassword}</p>
                  )}
                  {order.expectedPickupWindowLabel && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.expectedPickupDate} · {order.expectedPickupWindowLabel}
                    </p>
                  )}
                  {order.readyNotifiedAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(order.readyNotifiedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
