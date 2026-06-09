import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MessageCircle, RefreshCw, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { cn, formatDateTime, maskPhone } from "@/lib/utils";
import type { WhatsappConversationMessage } from "@/types/api";

const CONTENT_SOURCE_LABELS: Record<string, string> = {
  patient: "Paciente",
  template: "Template",
  rules: "Regras",
  ai: "IA",
  system: "Sistema",
};

function contentSourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  return CONTENT_SOURCE_LABELS[source] ?? source;
}

function parseMessageContext(contextJson: string | null | undefined) {
  if (!contextJson) return null;
  try {
    return JSON.parse(contextJson) as {
      intentKind?: string;
      parseType?: string;
      source?: string;
      confidence?: number;
    };
  } catch {
    return null;
  }
}

const INTENT_KIND_LABELS: Record<string, string> = {
  AddCarePlan: "Novo agendamento",
  ListCarePlans: "Meus medicamentos",
  General: "Mensagem geral",
  NotUnderstood: "Não entendido",
  Greeting: "Saudação",
  PharmacyQuestion: "Farmácia",
  ClinicalConcern: "Clínico",
  Taken: "Tomou",
  Missed: "Não tomou",
  Ambiguous: "Ambíguo",
};

function MessageBubble({ message }: { message: WhatsappConversationMessage }) {
  const outbound = message.direction === "Outbound";
  const sourceLabel = contentSourceLabel(message.contentSource);
  const ctx = !outbound ? parseMessageContext(message.contextJson) : null;
  const understandingSource = ctx?.source ? contentSourceLabel(ctx.source) : null;
  const understandingKind = ctx?.intentKind ?? ctx?.parseType;

  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          outbound
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        <div className="mb-1 flex flex-wrap gap-1">
          {sourceLabel && (
            <Badge
              variant={outbound ? "secondary" : "muted"}
              className={cn("text-[10px]", outbound && "bg-primary-foreground/15 text-primary-foreground")}
            >
              {sourceLabel}
            </Badge>
          )}
          {understandingSource && (
            <Badge variant="outline" className="text-[10px]">
              Entendido: {understandingSource}
              {understandingKind && ` · ${INTENT_KIND_LABELS[understandingKind] ?? understandingKind}`}
            </Badge>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time className="mt-1 block text-[10px] opacity-70">{formatDateTime(message.createdAt)}</time>
      </div>
    </div>
  );
}

function SchedulingSidebar({ scheduling }: { scheduling: NonNullable<import("@/types/api").WhatsappConversationThread["scheduling"]> }) {
  const nextPending = scheduling.reminders
    .filter((r) => r.status === "Pending")
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0];

  const firstReminderTomorrow =
    nextPending &&
    new Date(nextPending.scheduledFor).toDateString() >
      new Date().toDateString();

  return (
    <div className="space-y-3 rounded-xl border p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <CalendarClock className="size-4" />
        Agendamento
      </div>

      {(scheduling.carePlans?.length ? scheduling.carePlans : scheduling.carePlan ? [scheduling.carePlan] : []).length > 0 ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          {(scheduling.carePlans?.length ? scheduling.carePlans : scheduling.carePlan ? [scheduling.carePlan] : []).map((plan, idx) => (
            <div key={`${plan.medication}-${idx}`} className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p>
                <span className="font-medium text-foreground">{plan.medication}</span>
                {plan.dosage && <> · {plan.dosage}</>}
              </p>
              <p>Horários: {plan.scheduledTimes.replace(/,/g, ", ")}</p>
            </div>
          ))}
          {scheduling.activatedAt && (
            <p>Ativado em {formatDateTime(scheduling.activatedAt)}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum plano de cuidado ativo.</p>
      )}

      {nextPending ? (
        <div className="rounded-lg bg-muted/60 px-2 py-1.5 text-xs">
          <p className="font-medium text-foreground">Próximo lembrete</p>
          <p>{formatDateTime(nextPending.scheduledFor)}</p>
          {firstReminderTomorrow && (
            <p className="mt-1 text-muted-foreground">
              O template de conclusão diz &quot;a partir de amanhã&quot; — o primeiro envio está agendado para amanhã.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem lembretes pendentes.</p>
      )}

      {scheduling.conversationStep && (
        <p className="text-xs text-muted-foreground">
          Etapa da conversa: <span className="font-medium text-foreground">{scheduling.conversationStep}</span>
        </p>
      )}

      {scheduling.reminders.some((r) => r.status === "Failed") && (
        <p className="text-xs text-destructive">
          Há lembretes com falha de envio — verifique a lista abaixo.
        </p>
      )}

      {scheduling.reminders.length > 0 && (
        <ul className="max-h-32 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
          {scheduling.reminders.slice(0, 8).map((r) => (
            <li key={r.id} className="flex justify-between gap-2">
              <span>{formatDateTime(r.scheduledFor)}</span>
              <span className={cn(r.status === "Failed" && "text-destructive")}>{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WhatsappConversationsPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: () => api.listWhatsAppConversations(token!),
    enabled: !!token,
    refetchInterval: 10_000,
  });

  const thread = useQuery({
    queryKey: ["whatsapp-conversation-messages", selectedPatientId],
    queryFn: () => api.getWhatsAppConversationMessages(token!, selectedPatientId!),
    enabled: !!token && !!selectedPatientId,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!selectedPatientId && conversations.data?.length) {
      setSelectedPatientId(conversations.data[0].patientId);
    }
  }, [conversations.data, selectedPatientId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.messages]);

  const deleteMessages = useMutation({
    mutationFn: (patientId: string) => api.deleteWhatsAppConversationMessages(token!, patientId),
    onSuccess: (result) => {
      toast.success(`${result.deleted} mensagem(ns) excluída(s)`);
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", selectedPatientId],
      });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir"),
  });

  const deletePatient = useMutation({
    mutationFn: (patientId: string) => api.deletePatient(token!, patientId),
    onSuccess: () => {
      toast.success("Paciente excluído");
      setSelectedPatientId(null);
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir paciente"),
  });

  const selectedConversation = conversations.data?.find((c) => c.patientId === selectedPatientId);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Conversas
          </CardTitle>
          <CardDescription>
            Histórico real gravado pelo webhook — veja como a jornada se desenvolveu com cada contato.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={conversations.isFetching}
          onClick={() => void conversations.refetch()}
        >
          <RefreshCw className={cn("size-4", conversations.isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {conversations.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !conversations.data?.length ? (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma conversa ainda. Envie uma mensagem para o número Business e aguarde o webhook.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
            <div className="space-y-2 rounded-xl border p-2">
              {conversations.data.map((conversation) => {
                const active = conversation.patientId === selectedPatientId;
                return (
                  <button
                    key={conversation.patientId}
                    type="button"
                    onClick={() => setSelectedPatientId(conversation.patientId)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                      active ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {conversation.name ?? maskPhone(conversation.phone)}
                      </p>
                      <Badge variant="muted">{conversation.messageCount}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {maskPhone(conversation.phone)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {conversation.lastPreview}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-[320px] flex-col rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="font-medium">
                    {thread.data?.patient.name ?? selectedConversation?.name ?? "Contato"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {maskPhone(thread.data?.patient.phone ?? selectedConversation?.phone ?? "")}
                    {thread.data?.patient.status && (
                      <> · {thread.data.patient.status}</>
                    )}
                  </p>
                </div>
                {selectedPatientId && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deleteMessages.isPending || deletePatient.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Excluir todas as mensagens desta conversa? O paciente permanece cadastrado.",
                          )
                        ) {
                          return;
                        }
                        deleteMessages.mutate(selectedPatientId);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Limpar conversa
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleteMessages.isPending || deletePatient.isPending}
                      onClick={() => {
                        const label =
                          thread.data?.patient.name ??
                          selectedConversation?.name ??
                          maskPhone(thread.data?.patient.phone ?? selectedConversation?.phone ?? "");
                        if (
                          !window.confirm(
                            `Excluir permanentemente o paciente "${label}"? Esta ação remove mensagens, plano de cuidado, check-ins e todo o histórico. Não pode ser desfeita.`,
                          )
                        ) {
                          return;
                        }
                        deletePatient.mutate(selectedPatientId);
                      }}
                    >
                      <UserX className="size-4" />
                      Excluir paciente
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid flex-1 gap-0 lg:grid-cols-[1fr_minmax(200px,240px)]">
                <div className="space-y-3 overflow-y-auto border-b p-4 lg:border-b-0 lg:border-r">
                  {thread.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : !thread.data?.messages.length ? (
                    <p className="text-center text-sm text-muted-foreground">Sem mensagens nesta conversa.</p>
                  ) : (
                    thread.data.messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}
                  <div ref={threadEndRef} />
                </div>

                <div className="p-4">
                  {thread.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : thread.data?.scheduling ? (
                    <SchedulingSidebar scheduling={thread.data.scheduling} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
