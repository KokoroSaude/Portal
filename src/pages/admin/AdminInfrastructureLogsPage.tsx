import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { InfrastructureLogEntry } from "@/types/api";
import { cn } from "@/lib/utils";

type ServiceKey = "api" | "worker" | "scheduler";

const SERVICES: { key: ServiceKey; label: string }[] = [
  { key: "api", label: "API" },
  { key: "worker", label: "Worker" },
  { key: "scheduler", label: "Scheduler" },
];

const LIMIT_OPTIONS = [50, 100, 200, 500] as const;

function severityVariant(severity: string | null): "warning" | "secondary" | "outline" {
  if (!severity) return "outline";
  const s = severity.toLowerCase();
  if (s.includes("error") || s.includes("fatal") || s.includes("crit")) return "warning";
  if (s.includes("warn")) return "warning";
  return "secondary";
}

function formatLogLine(entry: InfrastructureLogEntry): string {
  const ts = entry.timestamp ? formatDateTime(entry.timestamp) : "";
  const sev = entry.severity ? `[${entry.severity}] ` : "";
  return ts ? `${ts} ${sev}${entry.message}` : `${sev}${entry.message}`;
}

export function AdminInfrastructureLogsPage() {
  const { token } = useAuth();
  const [activeService, setActiveService] = useState<ServiceKey>("api");
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState<number>(200);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const statusQuery = useQuery({
    queryKey: ["infrastructure-logs-status"],
    queryFn: () => api.getInfrastructureLogsStatus(token!),
    enabled: !!token,
  });

  const logsQuery = useQuery({
    queryKey: ["infrastructure-logs", activeService, limit, filter],
    queryFn: () =>
      api.getInfrastructureLogs(token!, activeService, {
        limit,
        filter: filter.trim() || undefined,
      }),
    enabled: !!token && statusQuery.data?.configured === true,
    refetchInterval: autoRefresh ? 15_000 : false,
    retry: (count, err) => {
      if (err instanceof ApiClientError && err.status === 503) return false;
      return count < 1;
    },
  });

  const logText = useMemo(
    () => (logsQuery.data?.logs ?? []).map(formatLogLine).join("\n"),
    [logsQuery.data?.logs],
  );

  const activeServiceStatus = statusQuery.data?.services.find((s) => s.key === activeService);

  async function copyAll() {
    if (!logText) {
      toast.error("Nenhum log para copiar");
      return;
    }
    try {
      await navigator.clipboard.writeText(logText);
      toast.success("Logs copiados para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar os logs");
    }
  }

  const notConfigured = statusQuery.data && !statusQuery.data.configured;
  const serviceNotConfigured = activeServiceStatus && !activeServiceStatus.configured;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de infraestrutura"
        description="Logs recentes dos serviços Railway (API, Worker e Scheduler) via deployment ativo."
      />

      {statusQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : notConfigured ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="size-5 text-muted-foreground" />
              Railway não configurado
            </CardTitle>
            <CardDescription>
              {statusQuery.data?.message ??
                "Defina RAILWAY_API_TOKEN, RAILWAY_ENVIRONMENT_ID e os IDs dos serviços na API."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Variáveis necessárias na API:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 font-mono text-xs">
              <li>RAILWAY_API_TOKEN</li>
              <li>RAILWAY_ENVIRONMENT_ID</li>
              <li>RAILWAY_PROJECT_ID (opcional — link do dashboard)</li>
              <li>RAILWAY_SERVICE_ID_API</li>
              <li>RAILWAY_SERVICE_ID_WORKER</li>
              <li>RAILWAY_SERVICE_ID_SCHEDULER</li>
            </ul>
          </CardContent>
        </Card>
      ) : (
        <>
          {statusQuery.data?.projectDashboardUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={statusQuery.data.projectDashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Abrir projeto no Railway
                </a>
              </Button>
            </div>
          ) : null}

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ScrollText className="size-5" />
                  Logs Railway
                </CardTitle>
                <CardDescription>
                  Deployment mais recente de cada serviço. Atualização automática a cada 15s.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={autoRefresh ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                >
                  Auto {autoRefresh ? "ON" : "OFF"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!logText}
                  onClick={() => void copyAll()}
                >
                  <Copy className="size-4" />
                  Copiar tudo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logsQuery.isFetching || serviceNotConfigured}
                  onClick={() => void logsQuery.refetch()}
                >
                  <RefreshCw className={cn("size-4", logsQuery.isFetching && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[200px] flex-1 space-y-2">
                  <Label htmlFor="log-filter">Filtro (texto)</Label>
                  <Input
                    id="log-filter"
                    placeholder="Ex.: error, webhook, reminder"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-limit">Limite</Label>
                  <select
                    id="log-limit"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                  >
                    {LIMIT_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} linhas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Tabs
                value={activeService}
                onValueChange={(v) => setActiveService(v as ServiceKey)}
              >
                <TabsList>
                  {SERVICES.map((s) => {
                    const svc = statusQuery.data?.services.find((x) => x.key === s.key);
                    return (
                      <TabsTrigger key={s.key} value={s.key} className="gap-2">
                        {s.label}
                        {svc && !svc.configured ? (
                          <Badge variant="outline" className="text-[10px]">
                            —
                          </Badge>
                        ) : null}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {SERVICES.map((s) => (
                  <TabsContent key={s.key} value={s.key} className="mt-4 space-y-3">
                    {serviceNotConfigured ? (
                      <p className="text-sm text-muted-foreground">
                        Serviço <strong>{s.label}</strong> não configurado (
                        <code className="text-xs">RAILWAY_SERVICE_ID_{s.key.toUpperCase()}</code>
                        ).
                      </p>
                    ) : logsQuery.isLoading ? (
                      <Skeleton className="h-64 w-full" />
                    ) : logsQuery.isError ? (
                      <p className="text-sm text-destructive">
                        {logsQuery.error instanceof ApiClientError
                          ? logsQuery.error.message
                          : "Erro ao carregar logs"}
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {logsQuery.data?.deploymentStatus ? (
                            <Badge variant="outline">{logsQuery.data.deploymentStatus}</Badge>
                          ) : null}
                          <span className="font-mono text-xs">
                            deployment: {logsQuery.data?.deploymentId}
                          </span>
                          {logsQuery.data?.dashboardUrl ? (
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <a
                                href={logsQuery.data.dashboardUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver no Railway
                                <ExternalLink className="ml-1 size-3" />
                              </a>
                            </Button>
                          ) : null}
                          {logsQuery.dataUpdatedAt ? (
                            <span className="text-xs">
                              Atualizado {formatDateTime(new Date(logsQuery.dataUpdatedAt).toISOString())}
                            </span>
                          ) : null}
                        </div>

                        <div
                          className="max-h-[min(70vh,640px)] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
                          role="log"
                          aria-live="polite"
                        >
                          {(logsQuery.data?.logs ?? []).length === 0 ? (
                            <p className="text-muted-foreground">Nenhum log retornado.</p>
                          ) : (
                            (logsQuery.data?.logs ?? []).map((entry, i) => (
                              <div key={`${entry.timestamp ?? "t"}-${i}`} className="whitespace-pre-wrap break-all py-0.5">
                                {entry.timestamp ? (
                                  <span className="text-muted-foreground">
                                    {formatDateTime(entry.timestamp)}{" "}
                                  </span>
                                ) : null}
                                {entry.severity ? (
                                  <Badge
                                    variant={severityVariant(entry.severity)}
                                    className="mr-1 align-middle text-[10px]"
                                  >
                                    {entry.severity}
                                  </Badge>
                                ) : null}
                                <span>{entry.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
