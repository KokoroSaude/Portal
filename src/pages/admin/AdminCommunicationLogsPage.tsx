import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Copy, RefreshCw, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api, ApiClientError } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { CommunicationLogEntry } from "@/types/api";

const LIMIT_OPTIONS = [50, 100, 200, 500] as const;

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "Todos os eventos" },
  { value: "ai.outbound.fallback_rules", label: "IA falhou → regras" },
  { value: "ai.outbound.route_missing", label: "Rota IA ausente" },
  { value: "ai.outbound.route_missing_rules", label: "Sem rota — só regras" },
  { value: "ai.outbound.tenant_ai_disabled", label: "IA desligada no tenant" },
  { value: "ai.outbound.personalized", label: "Personalização IA OK" },
  { value: "reminder.sent", label: "Lembrete enviado" },
  { value: "outbound.pipeline.sent", label: "Pipeline enviou mensagem" },
  { value: "outbound.pipeline.window_closed", label: "Janela WhatsApp fechada" },
] as const;

const CONTENT_SOURCE_OPTIONS = [
  { value: "", label: "Todas as origens" },
  { value: "ai", label: "IA" },
  { value: "rules", label: "Regras" },
  { value: "template", label: "Template" },
] as const;

const HOST_OPTIONS = [
  { value: "", label: "Todos os hosts" },
  { value: "api", label: "API" },
  { value: "worker", label: "Worker" },
] as const;

const SEVERITY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Aviso" },
  { value: "error", label: "Erro" },
] as const;

function severityVariant(severity: string): "warning" | "secondary" | "outline" {
  const s = severity.toLowerCase();
  if (s === "error" || s === "warning") return "warning";
  if (s === "info") return "secondary";
  return "outline";
}

function contentSourceVariant(source: string | null): "default" | "warning" | "secondary" | "outline" {
  if (!source) return "outline";
  if (source === "ai") return "default";
  if (source === "rules") return "warning";
  return "secondary";
}

function contentSourceLabel(source: string | null): string {
  if (!source) return "—";
  if (source === "ai") return "IA";
  if (source === "rules") return "Regras";
  if (source === "template") return "Template";
  return source;
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8);
}

function formatProperties(properties: string | null): string {
  if (!properties) return "";
  try {
    return JSON.stringify(JSON.parse(properties), null, 2);
  } catch {
    return properties;
  }
}

function LogDetailsRow({ entry }: { entry: CommunicationLogEntry }) {
  const [open, setOpen] = useState(false);
  const details = formatProperties(entry.properties);

  async function copyDetails() {
    const text = [
      entry.eventType,
      entry.summary,
      entry.contentSource ?? "",
      details,
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Detalhes copiados");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <>
      <TableRow className={cn(open && "bg-muted/30")}>
        <TableCell className="whitespace-nowrap text-xs">
          {formatDateTime(entry.occurredAt)}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="font-mono text-[10px]">
            {entry.host}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-xs">{entry.eventType}</TableCell>
        <TableCell>
          <Badge variant={severityVariant(entry.severity)} className="text-[10px]">
            {entry.severity}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={contentSourceVariant(entry.contentSource)} className="text-[10px]">
            {contentSourceLabel(entry.contentSource)}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[280px] truncate text-sm" title={entry.summary}>
          {entry.summary}
        </TableCell>
        <TableCell className="font-mono text-xs" title={entry.patientId ?? undefined}>
          {shortId(entry.patientId)}
        </TableCell>
        <TableCell className="text-right">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={8} className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Detalhes do evento</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyDetails()}>
                <Copy className="size-4" />
                Copiar
              </Button>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Categoria</dt>
                <dd className="font-mono text-xs">{entry.category}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tenant</dt>
                <dd className="font-mono text-xs">{entry.tenantId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paciente</dt>
                <dd className="font-mono text-xs">{entry.patientId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Lembrete</dt>
                <dd className="font-mono text-xs">{entry.reminderId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{entry.messageKind ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Canal</dt>
                <dd>{entry.channel ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Template</dt>
                <dd className="font-mono text-xs">{entry.templateKey ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Provider IA</dt>
                <dd>{entry.aiProvider ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Modelo IA</dt>
                <dd>{entry.aiModel ?? "—"}</dd>
              </div>
            </dl>
            {details ? (
              <pre className="max-h-64 overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed">
                {details}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Sem propriedades adicionais.</p>
            )}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

export function AdminCommunicationLogsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [contentSource, setContentSource] = useState("");
  const [host, setHost] = useState("");
  const [severity, setSeverity] = useState("");
  const [patientId, setPatientId] = useState("");
  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      eventType: eventType || undefined,
      contentSource: contentSource || undefined,
      host: host || undefined,
      severity: severity || undefined,
      patientId: patientId.trim() || undefined,
      limit,
      offset,
    }),
    [search, eventType, contentSource, host, severity, patientId, limit, offset],
  );

  const logsQuery = useQuery({
    queryKey: ["communication-logs", filters],
    queryFn: () => api.getCommunicationLogs(token!, filters),
    enabled: !!token,
    refetchInterval: autoRefresh ? 15_000 : false,
  });

  const total = logsQuery.data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs de comunicação"
        description="Rastreio de lembretes, personalização IA vs regras e envios outbound. Retenção automática de 7 dias."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-5" />
              Eventos operacionais
            </CardTitle>
            <CardDescription>
              Use o filtro <strong>IA falhou → regras</strong> para entender por que um lembrete não foi personalizado.
              Lembretes rodam no <strong>worker</strong>.
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
              disabled={logsQuery.isFetching}
              onClick={() => void logsQuery.refetch()}
            >
              <RefreshCw className={cn("size-4", logsQuery.isFetching && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="comm-search">Busca</Label>
              <Input
                id="comm-search"
                placeholder="Resumo, evento, template..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-event">Evento</Label>
              <select
                id="comm-event"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setOffset(0);
                }}
              >
                {EVENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-source">Origem do texto</Label>
              <select
                id="comm-source"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={contentSource}
                onChange={(e) => {
                  setContentSource(e.target.value);
                  setOffset(0);
                }}
              >
                {CONTENT_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-host">Host</Label>
              <select
                id="comm-host"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  setOffset(0);
                }}
              >
                {HOST_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-severity">Severidade</Label>
              <select
                id="comm-severity"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setOffset(0);
                }}
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-patient">Paciente (UUID)</Label>
              <Input
                id="comm-patient"
                placeholder="Opcional"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  setOffset(0);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-limit">Limite</Label>
              <select
                id="comm-limit"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} registros
                  </option>
                ))}
              </select>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : logsQuery.isError ? (
            <p className="text-sm text-destructive">
              {logsQuery.error instanceof ApiClientError
                ? logsQuery.error.message
                : "Erro ao carregar logs"}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {total} evento{total === 1 ? "" : "s"}
                  {logsQuery.data?.oldestRetainedAt
                    ? ` · retenção desde ${formatDateTime(logsQuery.data.oldestRetainedAt)}`
                    : null}
                </span>
                {logsQuery.dataUpdatedAt ? (
                  <span className="text-xs">
                    Atualizado {formatDateTime(new Date(logsQuery.dataUpdatedAt).toISOString())}
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Resumo</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logsQuery.data?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                          Nenhum evento nos últimos 7 dias com esses filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (logsQuery.data?.items ?? []).map((entry) => (
                        <LogDetailsRow key={entry.id} entry={entry} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canPrev}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {offset + 1}–{Math.min(offset + limit, total)} de {total}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canNext}
                  onClick={() => setOffset((o) => o + limit)}
                >
                  Próxima
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
