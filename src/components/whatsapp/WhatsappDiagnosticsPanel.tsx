import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
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
import { api, ApiClientError } from "@/lib/api";
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
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["whatsapp-diagnostics"],
    queryFn: () => api.getWhatsAppDiagnostics(token!),
    enabled: !!token,
    refetchInterval: 10_000,
  });

  const clearLogs = useMutation({
    mutationFn: () => api.clearWhatsAppDiagnosticEvents(token!),
    onSuccess: () => {
      toast.success("Logs da Meta limpos");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao limpar logs"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Logs da Meta (webhook)</CardTitle>
          <CardDescription>
            Eventos técnicos recebidos do webhook — útil para diagnosticar token, Phone ID e assinatura.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={clearLogs.isPending}
            onClick={() => clearLogs.mutate()}
          >
            <Trash2 className="size-4" />
            Limpar logs
          </Button>
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
        </div>
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
              <div className="space-y-2 rounded-xl border p-4">
                <p className="text-sm font-medium">Configuração Meta (servidor)</p>
                <MetaFlag ok={data.meta.hasAppSecret} label="App Secret" />
                <MetaFlag ok={data.meta.hasAccessToken} label="Access Token" />
                <MetaFlag ok={data.meta.hasPhoneId} label="Phone ID padrão" />
                <MetaFlag ok={data.meta.hasVerifyToken} label="Verify Token" />
                {data.meta.hasAppId !== undefined && (
                  <MetaFlag ok={!!data.meta.hasAppId} label="App ID (Embedded Signup)" />
                )}
                {data.meta.hasEmbeddedSignupConfig !== undefined && (
                  <MetaFlag
                    ok={!!data.meta.hasEmbeddedSignupConfig}
                    label="Config ID Embedded Signup"
                  />
                )}
                {data.meta.embeddedSignup && (
                  <>
                    <MetaFlag
                      ok={data.meta.embeddedSignup.enabled}
                      label="Embedded Signup habilitado"
                    />
                    <MetaFlag
                      ok={data.meta.embeddedSignup.hasWebhookCallback}
                      label="Callback webhook configurável"
                    />
                  </>
                )}
                {data.meta.simulatorMode && (
                  <p className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="size-4" />
                    Modo simulador ativo — Meta real desligada
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-xl border p-4">
                <p className="text-sm font-medium">IA da plataforma (servidor)</p>
                {data.platformAi ? (
                  <>
                    <MetaFlag ok={data.platformAi.isConfigured} label="Pronta para chamadas" />
                    <p className="text-sm text-muted-foreground">
                      Provedor: <span className="font-mono text-foreground">{data.platformAi.provider}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Modelo: <span className="font-mono text-foreground">{data.platformAi.model}</span>
                    </p>
                    <MetaFlag
                      ok={data.platformAi.openAiConfigured}
                      label={
                        data.platformAi.openAiKeyHint
                          ? `OpenAI (${data.platformAi.openAiKeyHint})`
                          : "OpenAI sem chave"
                      }
                    />
                    <MetaFlag
                      ok={data.platformAi.anthropicConfigured}
                      label={
                        data.platformAi.anthropicKeyHint
                          ? `Anthropic (${data.platformAi.anthropicKeyHint})`
                          : "Anthropic sem chave"
                      }
                    />
                    <MetaFlag
                      ok={data.platformAi.geminiConfigured}
                      label={
                        data.platformAi.geminiKeyHint
                          ? `Gemini (${data.platformAi.geminiKeyHint})`
                          : "Gemini sem chave"
                      }
                    />
                    <MetaFlag
                      ok={data.platformAi.groqConfigured}
                      label={
                        data.platformAi.groqKeyHint
                          ? `Groq (${data.platformAi.groqKeyHint})`
                          : "Groq sem chave"
                      }
                    />
                    {!data.platformAi.isConfigured && (
                      <p className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="size-4 shrink-0" />
                        Configure o provedor ativo em Superadmin → Configuração de IA.
                      </p>
                    )}
                    {data.platformAi.provider === "anthropic" && !data.platformAi.anthropicConfigured && (
                      <p className="text-xs text-destructive">
                        Provedor Anthropic, mas a chave Anthropic não está disponível no servidor.
                      </p>
                    )}
                    {data.platformAi.provider === "openai" && !data.platformAi.openAiConfigured && (
                      <p className="text-xs text-destructive">
                        Provedor OpenAI, mas a chave OpenAI não está disponível no servidor.
                      </p>
                    )}
                    {data.platformAi.provider === "gemini" && !data.platformAi.geminiConfigured && (
                      <p className="text-xs text-destructive">
                        Provedor Gemini, mas a chave Gemini não está disponível no servidor.
                      </p>
                    )}
                    {data.platformAi.provider === "groq" && !data.platformAi.groqConfigured && (
                      <p className="text-xs text-destructive">
                        Provedor Groq, mas a chave Groq não está disponível no servidor.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Indisponível nesta versão da API — atualize o deploy.
                  </p>
                )}
              </div>

              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-sm font-medium">Como interpretar</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  <li>
                    <code className="text-xs">401</code> no detalhe → gere token permanente (System User).
                  </li>
                  <li>
                    <code className="text-xs">tenant_not_found</code> → Phone ID do remetente incorreto.
                  </li>
                  <li>
                    <code className="text-xs">processed_with_reply</code> → Kokoro enviou resposta à Meta.
                  </li>
                  <li>
                    Respostas com IA só após chamada real ao provedor acima.
                  </li>
                </ul>
              </div>
            </div>

            {data.senders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Remetentes ({data.senders.length})</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Conexão</TableHead>
                      <TableHead>Token Meta</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.senders.map((sender) => (
                      <TableRow key={sender.id}>
                        <TableCell className="font-medium">{sender.displayName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sender.connectionSource === "EmbeddedSignup" ? "default" : "outline"
                            }
                          >
                            {sender.connectionSource === "EmbeddedSignup"
                              ? "Via Meta"
                              : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <MetaFlag
                            ok={!!sender.hasEmbeddedToken}
                            label={sender.hasEmbeddedToken ? "Por tenant" : "Token global"}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={sender.isActive ? "success" : "muted"}>
                            {sender.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Eventos ({data.events.length})</p>
              {data.events.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum evento registrado nesta réplica da API.
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
                    {data.events
                      .filter(
                        (event) =>
                          event.eventType !== "webhook.post_received" &&
                          event.eventType !== "webhook.no_messages",
                      )
                      .map((event, i) => (
                      <TableRow key={`${event.at}-${event.eventType}-${i}`}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatDateTime(event.at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={eventVariant(event.eventType)}>{eventLabel(event)}</Badge>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
