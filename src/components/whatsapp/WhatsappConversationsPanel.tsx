import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, FileText, MessageCircle, Mic, Pause, Play, RefreshCw, Send, Sparkles, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { CONVERSATION_STEP_LABELS, CONTENT_SOURCE_LABELS } from "@/lib/constants";
import { cn, formatDateTime, maskPhone } from "@/lib/utils";
import type { WhatsappConversationMessage, WhatsappConversationThread } from "@/types/api";

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
  const isAudio = message.messageType === "audio";
  const isPrescriptionMedia =
    !outbound && (message.messageType === "image" || message.messageType === "document");
  const sourceLabel = contentSourceLabel(message.contentSource);
  const ctx = !outbound ? parseMessageContext(message.contextJson) : null;
  const understandingSource = ctx?.source ? contentSourceLabel(ctx.source) : null;
  const understandingKind = ctx?.intentKind ?? ctx?.parseType;
  const displayText =
    !outbound && isAudio && message.transcript
      ? message.transcript
      : !outbound && isPrescriptionMedia && message.transcript
        ? message.transcript
        : message.content;

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
          {isAudio && (
            <Badge
              variant={outbound ? "secondary" : "muted"}
              className={cn("gap-0.5 text-[10px]", outbound && "bg-primary-foreground/15 text-primary-foreground")}
            >
              <Mic className="size-3" />
              Áudio
            </Badge>
          )}
          {isPrescriptionMedia && (
            <Badge
              variant={outbound ? "secondary" : "muted"}
              className={cn("gap-0.5 text-[10px]", outbound && "bg-primary-foreground/15 text-primary-foreground")}
            >
              <FileText className="size-3" />
              Receita
            </Badge>
          )}
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
          {outbound && message.templateKey && (
            <Badge variant="outline" className="text-[10px] font-mono">
              {message.templateKey}
            </Badge>
          )}
        </div>
        {!outbound && isAudio && message.transcript && message.transcript !== message.content && (
          <p className="mb-1 text-[10px] opacity-70">Transcrição automática</p>
        )}
        {!outbound && isPrescriptionMedia && message.transcript && message.transcript !== message.content && (
          <p className="mb-1 text-[10px] opacity-70">Texto extraído da receita</p>
        )}
        <p className="whitespace-pre-wrap break-words">{displayText}</p>
        <time className="mt-1 block text-[10px] opacity-70">{formatDateTime(message.createdAt)}</time>
      </div>
    </div>
  );
}

function SchedulingSidebar({
  scheduling,
  patientId,
  patientStatus,
  canWrite,
  onPause,
  onResume,
  isPausing,
  isResuming,
}: {
  scheduling: NonNullable<WhatsappConversationThread["scheduling"]>;
  patientId: string;
  patientStatus: string;
  canWrite: boolean;
  onPause: () => void;
  onResume: () => void;
  isPausing: boolean;
  isResuming: boolean;
}) {
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
          <p className="font-medium text-foreground">
            Medicamentos ({(scheduling.carePlans?.length ? scheduling.carePlans : scheduling.carePlan ? [scheduling.carePlan] : []).length})
          </p>
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

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={`/pacientes/${patientId}`}>
            <ExternalLink className="size-3.5" />
            Ficha do paciente
          </Link>
        </Button>
        {canWrite && patientStatus === "Active" && (
          <Button type="button" variant="outline" size="sm" disabled={isPausing} onClick={onPause}>
            <Pause className="size-3.5" />
            Pausar
          </Button>
        )}
        {canWrite && (patientStatus === "Paused" || patientStatus === "Reengagement") && (
          <Button type="button" variant="outline" size="sm" disabled={isResuming} onClick={onResume}>
            <Play className="size-3.5" />
            Retomar
          </Button>
        )}
      </div>

      {scheduling.pausedUntil && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Pausado até {formatDateTime(scheduling.pausedUntil)}
        </p>
      )}

      {(scheduling.consecutiveMissedCheckins ?? 0) >= 2 && (
        <p className="text-xs text-muted-foreground">
          {scheduling.consecutiveMissedCheckins} check-ins perdidos seguidos
        </p>
      )}

      {scheduling.openReengagementAttempt != null && (
        <p className="text-xs text-muted-foreground">
          Reengajamento em andamento — tentativa {scheduling.openReengagementAttempt}
          {scheduling.openReengagementSentAt && (
            <> · enviado {formatDateTime(scheduling.openReengagementSentAt)}</>
          )}
        </p>
      )}

      {scheduling.conversationStep && (
        <p className="text-xs text-muted-foreground">
          Etapa da conversa:{" "}
          <span className="font-medium text-foreground">
            {CONVERSATION_STEP_LABELS[scheduling.conversationStep] ?? scheduling.conversationStep}
          </span>
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
            <li key={r.id} className="flex flex-col gap-0.5">
              <div className="flex justify-between gap-2">
                <span>{formatDateTime(r.scheduledFor)}</span>
                <span className={cn(r.status === "Failed" && "text-destructive")}>{r.status}</span>
              </div>
              {r.failureReason && (
                <span className="text-destructive/80">{r.failureReason}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WhatsappConversationsPanel() {
  const { token, isAdmin, canWrite } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromUrl);
  const [replyText, setReplyText] = useState("");
  const [requestCsat, setRequestCsat] = useState(false);
  const [onlyPharmacyMessages, setOnlyPharmacyMessages] = useState(false);
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

  const promoDefaults = useQuery({
    queryKey: ["promo-defaults"],
    queryFn: () => api.getPromoDefaults(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (promoDefaults.data?.defaultMessage && !replyText) {
      setReplyText(promoDefaults.data.defaultMessage);
    }
  }, [promoDefaults.data?.defaultMessage, replyText]);

  useEffect(() => {
    if (patientIdFromUrl) {
      setSelectedPatientId(patientIdFromUrl);
      return;
    }
    if (!selectedPatientId && conversations.data?.length) {
      setSelectedPatientId(conversations.data[0].patientId);
    }
  }, [conversations.data, selectedPatientId, patientIdFromUrl]);

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

  const pausePatient = useMutation({
    mutationFn: (patientId: string) => api.pausePatient(token!, patientId),
    onSuccess: () => {
      toast.success("Paciente pausado");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", selectedPatientId],
      });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao pausar"),
  });

  const resumePatient = useMutation({
    mutationFn: (patientId: string) => api.resumePatient(token!, patientId),
    onSuccess: () => {
      toast.success("Paciente reativado");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", selectedPatientId],
      });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao retomar"),
  });

  const generateTcpDraft = useMutation({
    mutationFn: () =>
      api.previewTpbIntervention(token!, selectedPatientId!, replyText.trim() || undefined),
    onSuccess: (result) => {
      setReplyText(result.text);
      toast.success("Rascunho gerado com TCP");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "TCP indisponível para este paciente"),
  });

  const sendOperatorReply = useMutation({
    mutationFn: ({
      patientId,
      text,
      usePromotionTemplate = false,
      requestCsat: askCsat = false,
    }: {
      patientId: string;
      text: string;
      usePromotionTemplate?: boolean;
      requestCsat?: boolean;
    }) =>
      api.sendWhatsAppOperatorReply(token!, patientId, {
        text,
        usePromotionTemplate,
        requestCsat: askCsat,
      }),
    onSuccess: (res) => {
      if (res.messageType === "audio") {
        toast.success("Nota de voz enviada");
      } else if (res.voiceFallbackReason) {
        toast.warning(`Enviado como texto: ${res.voiceFallbackReason}`);
      } else {
        toast.success("Mensagem enviada");
      }
      setReplyText("");
      setRequestCsat(false);
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["whatsapp-conversation-messages", selectedPatientId],
      });
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.status === 422) {
        toast.error(err.message || "Não foi possível enviar a mensagem.");
        return;
      }
      if (err instanceof ApiClientError && err.status === 503) {
        toast.error(err.message || "Template Meta não configurado.");
        return;
      }
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar mensagem");
    },
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

  const conversationList = conversations.data ?? [];
  const selectedConversation = conversationList.find((c) => c.patientId === selectedPatientId);
  const messagingWindow = thread.data?.messagingWindow ?? selectedConversation?.messagingWindow;
  const outboundContent = thread.data?.outboundContent;
  const canSendRegularMessage = messagingWindow?.isOpen ?? true;
  const canSendTemplateMessage = !canSendRegularMessage && !!messagingWindow?.canSendTemplate;
  const canSendPromotionTemplate = !!messagingWindow?.canSendPromotionTemplate;
  const canSendAnyMessage = canSendRegularMessage || canSendTemplateMessage || canSendPromotionTemplate;
  const canGenerateTcp =
    canSendRegularMessage &&
    !!outboundContent?.tpbEnabled &&
    (outboundContent?.nextChannel === "ai" || outboundContent?.mode === "AiOnly");

  const outboundModeLabel =
    outboundContent?.mode === "AiOnly"
      ? "Modo: IA"
      : outboundContent?.mode === "Alternate"
        ? `Intercalar · próximo: ${outboundContent.nextChannel === "ai" ? "IA" : "template"}`
        : "Modo: template";
  const displayedMessages = onlyPharmacyMessages
    ? (thread.data?.messages ?? []).filter((m) => m.contentSource === "operator")
    : (thread.data?.messages ?? []);

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
        ) : !conversationList.length && !patientIdFromUrl ? (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma conversa ainda. Envie uma mensagem para o número Business e aguarde o webhook.
          </p>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              conversationList.length > 0
                ? "lg:grid-cols-[minmax(220px,280px)_1fr]"
                : "lg:grid-cols-1",
            )}
          >
            {conversationList.length > 0 && (
            <div className="max-h-80 space-y-2 overflow-y-auto overscroll-contain rounded-xl border p-2 sm:max-h-96">
              {conversationList.map((conversation) => {
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
                      <div className="flex items-center gap-1">
                        <Badge variant={conversation.messagingWindow.isOpen ? "secondary" : "outline"}>
                          {conversation.messagingWindow.isOpen ? "24h aberta" : "24h expirada"}
                        </Badge>
                        <Badge variant="muted">{conversation.messageCount}</Badge>
                      </div>
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
            )}

            <div className="flex min-h-[320px] flex-col rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="font-medium">
                    {thread.data?.patient.name ?? selectedConversation?.name ?? "Contato"}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{maskPhone(thread.data?.patient.phone ?? selectedConversation?.phone ?? "")}</span>
                    {thread.data?.patient.status && (
                      <PatientStatusBadge status={thread.data.patient.status} />
                    )}
                    {thread.data?.patient.preferredMessageChannel === "Audio" && (
                      <Badge variant="outline" className="gap-0.5 text-[10px]">
                        <Mic className="size-3" />
                        Canal: áudio
                      </Badge>
                    )}
                  </p>
                </div>
                {selectedPatientId && isAdmin && (
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
                  ) : !displayedMessages.length ? (
                    <p className="text-center text-sm text-muted-foreground">Sem mensagens nesta conversa.</p>
                  ) : (
                    displayedMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}
                  <div ref={threadEndRef} />
                  <div className="mt-2 flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium">Só Farmácia</span>
                    <Switch
                      checked={onlyPharmacyMessages}
                      onCheckedChange={setOnlyPharmacyMessages}
                      aria-label="Filtrar apenas mensagens da farmácia"
                    />
                  </div>
                  {canWrite && selectedPatientId && (
                    <div className="space-y-2 border-t pt-3">
                      {outboundContent && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {outboundModeLabel}
                        </Badge>
                      )}
                      {messagingWindow && (
                        <div
                          className={cn(
                            "rounded-md border px-3 py-2 text-xs",
                            canSendRegularMessage
                              ? "border-emerald-300/60 bg-emerald-50/60 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                              : "border-amber-300/60 bg-amber-50/60 text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
                          )}
                        >
                          {canSendRegularMessage
                            ? `Janela de 24h aberta${messagingWindow.expiresAt ? ` até ${formatDateTime(messagingWindow.expiresAt)}` : ""}.`
                            : canSendTemplateMessage
                              ? "Janela expirada — o envio usará template Meta aprovado."
                              : "Janela de 24h expirada. Configure template Meta ou aguarde resposta do paciente."}
                        </div>
                      )}
                      <Textarea
                        placeholder="Responder como farmácia ou texto da promoção…"
                        value={replyText}
                        rows={3}
                        disabled={
                          sendOperatorReply.isPending ||
                          generateTcpDraft.isPending ||
                          !canSendAnyMessage
                        }
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && replyText.trim() && canSendAnyMessage) {
                            e.preventDefault();
                            sendOperatorReply.mutate({
                              patientId: selectedPatientId,
                              text: replyText.trim(),
                              requestCsat,
                            });
                          }
                        }}
                      />
                      {canSendRegularMessage && (
                        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                          <span className="text-muted-foreground">
                            Pedir avaliação de satisfação (1–5) após esta mensagem
                          </span>
                          <Switch
                            checked={requestCsat}
                            onCheckedChange={setRequestCsat}
                            aria-label="Pedir avaliação de satisfação"
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap justify-end gap-2">
                        {canGenerateTcp && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={generateTcpDraft.isPending || sendOperatorReply.isPending}
                            onClick={() => generateTcpDraft.mutate()}
                          >
                            <Sparkles className="size-4" />
                            Gerar com TCP
                          </Button>
                        )}
                        {canSendPromotionTemplate && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!replyText.trim() || sendOperatorReply.isPending}
                            onClick={() =>
                              sendOperatorReply.mutate({
                                patientId: selectedPatientId,
                                text: replyText.trim(),
                                usePromotionTemplate: true,
                              })
                            }
                          >
                            Enviar promoção
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          disabled={!replyText.trim() || sendOperatorReply.isPending || !canSendAnyMessage}
                          onClick={() =>
                            sendOperatorReply.mutate({
                              patientId: selectedPatientId,
                              text: replyText.trim(),
                              requestCsat,
                            })
                          }
                        >
                          <Send className="size-4" />
                          Enviar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {thread.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : thread.data?.scheduling ? (
                    <SchedulingSidebar
                      scheduling={thread.data.scheduling}
                      patientId={thread.data.patient.id}
                      patientStatus={thread.data.patient.status}
                      canWrite={canWrite}
                      isPausing={pausePatient.isPending}
                      isResuming={resumePatient.isPending}
                      onPause={() => {
                        if (!window.confirm("Pausar lembretes deste paciente?")) return;
                        pausePatient.mutate(thread.data.patient.id);
                      }}
                      onResume={() => resumePatient.mutate(thread.data.patient.id)}
                    />
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
