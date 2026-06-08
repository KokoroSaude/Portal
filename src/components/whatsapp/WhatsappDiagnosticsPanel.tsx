import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { WhatsappDiagnosticEvent } from "@/types/api";
import { cn } from "@/lib/utils";

function eventVariant(eventType: string): "success" | "warning" | "secondary" | "outline" {
  if (
    eventType.includes("failed") ||
    eventType.includes("not_found") ||
    eventType === "webhook.signature_failed"
  ) {
    return "warning";
  }
  if (eventType.includes("received") || eventType.includes("processed_with_reply")) {
    return "success";
  }
  if (eventType.includes("no_") || eventType === "webhook.duplicate") {
    return "secondary";
  }
  return "outline";
}

function eventLabel(event: WhatsappDiagnosticEvent): string {
  const labels: Record<string, string> = {
    "webhook.post_received": "Meta chamou a API",
    "webhook.signature_failed": "Assinatura inválida (App Secret)",
    "webhook.invalid_json": "JSON inválido",
    "webhook.no_entries": "Payload sem entries",
    "webhook.no_messages": "Sem mensagens (só status)",
    "webhook.tenant_not_found": "Phone ID não cadastrado",
    "webhook.duplicate": "Mensagem duplicada",
    "webhook.received": "Mensagem recebida",
    "webhook.processed_with_reply": "Processada com resposta",
    "webhook.processed_no_reply": "Processada sem resposta",
    "webhook.handler_failed": "Erro ao processar",
  };
  return labels[event.eventType] ?? event.eventType;
}

function MetaFlag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
      ) : (
        <XCircle className="size-4 shrink-0 text-destructive" />
      )}
      <span className={cn(!ok && "text-destructive")}>{label}</span>
    </div>
  );
}

export function WhatsappDiagnosticsPanel() {
  const { token } = useAuth();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["whatsapp-diagnostics"],
    queryFn: () => api.getWhatsAppDiagnostics(token!),
    enabled: !!token,
    refetchInterval: 10_000,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Diagnóstico em tempo real</CardTitle>
          <CardDescription>
            Eventos recentes do webhook Meta e mensagens gravadas. Envie um teste pelo WhatsApp e
            atualize esta tela.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o diagnóstico.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Atualizado {formatDateTime(new Date(dataUpdatedAt).toISOString())} · {data.note}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-sm font-medium">Configuração Meta (servidor)</p>
                <MetaFlag ok={data.meta.hasAppSecret} label="App Secret" />
                <MetaFlag ok={data.meta.hasAccessToken} label="Access Token" />
                <MetaFlag ok={data.meta.hasPhoneId} label="Phone ID padrão" />
                <MetaFlag ok={data.meta.hasVerifyToken} label="Verify Token" />
                {data.meta.simulatorMode && (
                  <p className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="size-4" />
                    Modo simulador ativo — Meta real desligada
                  </p>
                )}
              </div>

              <div className="rounded-xl border p-4 space-y-2 sm:col-span-2">
                <p className="text-sm font-medium">Como interpretar</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Nada em eventos após enviar mensagem → Meta não está chamando o webhook.</li>
                  <li>
                    <code className="text-xs">tenant_not_found</code> → Phone ID do remetente não
                    bate com a Meta.
                  </li>
                  <li>
                    <code className="text-xs">signature_failed</code> → App Secret incorreto no
                    Railway.
                  </li>
                  <li>
                    <code className="text-xs">processed_with_reply</code> → Kokoro respondeu (se não
                    chegou no celular, é entrega Meta).
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Eventos do webhook ({data.events.length})</p>
              {data.events.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum evento ainda. Mande uma mensagem para o número Business e clique em
                  Atualizar.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>De / Phone ID</TableHead>
                      <TableHead>Detalhe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.events.map((event, i) => (
                      <TableRow key={`${event.at}-${event.eventType}-${i}`}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(event.at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={eventVariant(event.eventType)}>
                            {eventLabel(event)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {event.from && <div>{event.from}</div>}
                          {event.phoneId && (
                            <div className="text-muted-foreground">{event.phoneId}</div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {event.error ?? event.detail ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Mensagens recentes no banco ({data.recentMessages.length})</p>
              {data.recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma mensagem gravada ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Direção</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentMessages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(msg.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={msg.direction === "Inbound" ? "secondary" : "outline"}>
                            {msg.direction === "Inbound" ? "Recebida" : "Enviada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm">{msg.content}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{msg.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
