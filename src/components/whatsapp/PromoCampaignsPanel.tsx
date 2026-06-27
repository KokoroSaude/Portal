import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Megaphone, Plus, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppMessagePreview } from "@/components/messages/WhatsAppMessagePreview";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PromoCampaignListItem } from "@/types/api";

const SEGMENTS = [
  { value: "ActivePatients", label: "Pacientes ativos" },
  { value: "AllEligible", label: "Todos elegíveis (exceto onboarding e opt-out)" },
  { value: "PatientsOnMedication", label: "Pacientes em um medicamento (catálogo)" },
] as const;

const FALLBACK_PROMO_TEMPLATE_BODY =
  "Olá, {{nome}}! Temos uma promoção especial para você: {{mensagem}} Responda por aqui se tiver interesse.";

function segmentLabel(value: string): string {
  return SEGMENTS.find((s) => s.value === value)?.label ?? value;
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "warning" {
  switch (status) {
    case "Completed":
      return "secondary";
    case "Sending":
    case "Scheduled":
      return "default";
    case "Failed":
      return "warning";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "Draft":
      return "Rascunho";
    case "Scheduled":
      return "Agendada";
    case "Sending":
      return "Enviando";
    case "Completed":
      return "Concluída";
    case "Failed":
      return "Falhou";
    case "Cancelled":
      return "Desativada";
    default:
      return status;
  }
}

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultScheduleLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

function localDatetimeToUtcIso(local: string): string {
  return new Date(local).toISOString();
}

export function PromoCampaignsPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState("");
  const [purchaseUrlSuffix, setPurchaseUrlSuffix] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [segment, setSegment] = useState<string>("ActivePatients");
  const [segmentMedicationId, setSegmentMedicationId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleAtLocal, setScheduleAtLocal] = useState(defaultScheduleLocal);

  const defaults = useQuery({
    queryKey: ["promo-defaults"],
    queryFn: () => api.getPromoDefaults(token!),
    enabled: !!token,
  });

  const medications = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token && segment === "PatientsOnMedication",
  });

  const campaigns = useQuery({
    queryKey: ["promo-campaigns"],
    queryFn: () => api.listPromoCampaigns(token!),
    enabled: !!token,
    refetchInterval: (query) => {
      const data = query.state.data ?? [];
      const hasSending = data.some((c) => c.status === "Sending");
      const hasScheduledSoon = data.some(
        (c) =>
          c.status === "Scheduled" &&
          c.scheduledAt &&
          new Date(c.scheduledAt).getTime() - Date.now() < 5 * 60_000,
      );
      return hasSending || hasScheduledSoon ? 5_000 : false;
    },
  });

  const detail = useQuery({
    queryKey: ["promo-campaign", selectedId],
    queryFn: () => api.getPromoCampaign(token!, selectedId!),
    enabled: !!token && !!selectedId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "Sending" || status === "Scheduled" ? 5_000 : false;
    },
  });

  const list = campaigns.data ?? [];
  const selectedSummary = list.find((c) => c.id === selectedId) ?? null;
  const isEditingDraft = selectedSummary?.status === "Draft";
  const isCreatingNew = !selectedId;
  const templateReady = defaults.data?.promotionTemplateConfigured ?? false;
  const promoSenderConfigured = defaults.data?.promoSenderConfigured ?? false;
  const promoTemplateBody =
    defaults.data?.templateBody?.trim() || FALLBACK_PROMO_TEMPLATE_BODY;
  const promoPreviewVariables = {
    nome: "Maria",
    mensagem: message.trim() || defaults.data?.defaultMessage?.trim() || undefined,
  };
  const eligibleCountForSegment =
    segment === "ActivePatients"
      ? defaults.data?.activePatientsCount
      : segment === "AllEligible"
        ? defaults.data?.allEligibleCount
        : null;
  const segmentHasNoEligiblePatients =
    !isEditingDraft && eligibleCountForSegment !== null && eligibleCountForSegment === 0;
  const formValid =
    !!message.trim() &&
    templateReady &&
    promoSenderConfigured &&
    (segment !== "PatientsOnMedication" || !!segmentMedicationId) &&
    !segmentHasNoEligiblePatients;

  useEffect(() => {
    if (defaults.data?.defaultMessage && isCreatingNew && !message) {
      setMessage(defaults.data.defaultMessage);
    }
  }, [defaults.data?.defaultMessage, isCreatingNew, message]);

  useEffect(() => {
    if (detail.isError) {
      toast.error(
        detail.error instanceof ApiClientError
          ? detail.error.message
          : "Erro ao carregar campanha",
      );
    }
  }, [detail.isError, detail.error]);

  const invalidateCampaign = () => {
    void queryClient.invalidateQueries({ queryKey: ["promo-campaigns"] });
    if (selectedId) {
      void queryClient.invalidateQueries({ queryKey: ["promo-campaign", selectedId] });
    }
  };

  const scrollToEditor = () => {
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resetNewForm = () => {
    setSelectedId(null);
    setMessage(defaults.data?.defaultMessage ?? "");
    setPurchaseUrlSuffix("");
    setCouponCode("");
    setSegment("ActivePatients");
    setSegmentMedicationId("");
    setScheduleAtLocal(defaultScheduleLocal());
  };

  const selectCampaign = (campaign: PromoCampaignListItem) => {
    setSelectedId(campaign.id);
    setMessage(campaign.message);
    setPurchaseUrlSuffix(campaign.purchaseUrlSuffix ?? "");
    setCouponCode(campaign.couponCode ?? "");
    setSegment(campaign.segment);
    if (campaign.status === "Draft") {
      setScheduleAtLocal(defaultScheduleLocal());
    }
    scrollToEditor();
  };

  const buttonFields = () => ({
    purchaseUrlSuffix: purchaseUrlSuffix.trim() || undefined,
    couponCode: couponCode.trim() || undefined,
  });

  const createDraftPayload = () => ({
    message: message.trim(),
    segment,
    segmentMedicationId:
      segment === "PatientsOnMedication" ? segmentMedicationId || undefined : undefined,
    ...buttonFields(),
  });

  const updatePayload = () => ({ message: message.trim(), ...buttonFields() });

  const draftChanged = () =>
    message.trim() !== (selectedSummary?.message ?? "") ||
    (purchaseUrlSuffix.trim() || "") !== (selectedSummary?.purchaseUrlSuffix ?? "") ||
    (couponCode.trim() || "") !== (selectedSummary?.couponCode ?? "");

  const createCampaign = useMutation({
    mutationFn: () => api.createPromoCampaign(token!, createDraftPayload()),
    onSuccess: (result) => {
      toast.success(`Campanha criada — ${result.totalRecipients} destinatário(s)`);
      setSelectedId(result.campaignId);
      void queryClient.invalidateQueries({ queryKey: ["promo-campaigns"] });
      scrollToEditor();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar campanha"),
  });

  const updateCampaign = useMutation({
    mutationFn: () => api.updatePromoCampaign(token!, selectedId!, updatePayload()),
    onSuccess: () => {
      toast.success("Rascunho salvo");
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar campanha"),
  });

  const sendCampaign = useMutation({
    mutationFn: (campaignId: string) => api.sendPromoCampaign(token!, campaignId),
    onSuccess: () => {
      toast.success("Envio iniciado em segundo plano");
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar campanha"),
  });

  const scheduleCampaign = useMutation({
    mutationFn: ({ campaignId, scheduledAt }: { campaignId: string; scheduledAt: string }) =>
      api.schedulePromoCampaign(token!, campaignId, scheduledAt),
    onSuccess: (result) => {
      toast.success(`Campanha agendada para ${formatDateTime(result.scheduledAt)}`);
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao agendar campanha"),
  });

  const cancelSchedule = useMutation({
    mutationFn: (campaignId: string) => api.cancelScheduledPromoCampaign(token!, campaignId),
    onSuccess: () => {
      toast.success("Agendamento cancelado — campanha voltou para rascunho");
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao cancelar agendamento"),
  });

  const deactivateCampaign = useMutation({
    mutationFn: (campaignId: string) => api.deactivatePromoCampaign(token!, campaignId),
    onSuccess: () => {
      toast.success("Campanha desativada");
      resetNewForm();
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao desativar campanha"),
  });

  const deleteCampaign = useMutation({
    mutationFn: (campaignId: string) => api.deletePromoCampaign(token!, campaignId),
    onSuccess: () => {
      toast.success("Campanha excluída");
      resetNewForm();
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir campanha"),
  });

  const createAndSend = useMutation({
    mutationFn: async () => {
      let campaignId = selectedId;
      if (!isEditingDraft) {
        const result = await api.createPromoCampaign(token!, createDraftPayload());
        campaignId = result.campaignId;
        setSelectedId(result.campaignId);
      } else if (draftChanged()) {
        await api.updatePromoCampaign(token!, campaignId!, updatePayload());
      }
      await api.sendPromoCampaign(token!, campaignId!);
    },
    onSuccess: () => {
      toast.success("Envio iniciado em segundo plano");
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar campanha"),
  });

  const createAndSchedule = useMutation({
    mutationFn: async () => {
      let campaignId = selectedId;
      if (!isEditingDraft) {
        const result = await api.createPromoCampaign(token!, createDraftPayload());
        campaignId = result.campaignId;
        setSelectedId(result.campaignId);
      } else if (draftChanged()) {
        await api.updatePromoCampaign(token!, campaignId!, updatePayload());
      }
      return api.schedulePromoCampaign(
        token!,
        campaignId!,
        localDatetimeToUtcIso(scheduleAtLocal),
      );
    },
    onSuccess: (result) => {
      toast.success(`Campanha agendada para ${formatDateTime(result.scheduledAt)}`);
      invalidateCampaign();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao agendar campanha"),
  });

  const confirmDeactivate = (campaignId: string, label: string) => {
    if (!window.confirm(`Desativar esta campanha?\n\n${label}`)) return;
    deactivateCampaign.mutate(campaignId);
  };

  const confirmDelete = (campaignId: string, label: string) => {
    if (
      !window.confirm(
        `Excluir permanentemente esta campanha?\n\n${label}\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    deleteCampaign.mutate(campaignId);
  };

  const actionPending =
    createCampaign.isPending ||
    updateCampaign.isPending ||
    createAndSend.isPending ||
    createAndSchedule.isPending ||
    sendCampaign.isPending ||
    scheduleCampaign.isPending;

  const canDeactivate = (status: string) => status === "Draft" || status === "Scheduled";
  const canDelete = (status: string) => status !== "Sending";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Campanhas</CardTitle>
            <CardDescription>Selecione uma campanha para editar, enviar ou excluir</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetNewForm}>
              <Plus className="size-4" />
              Nova campanha
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={campaigns.isFetching}
              onClick={() => void campaigns.refetch()}
            >
              <RefreshCw className={campaigns.isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !list.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma campanha ainda.</p>
          ) : (
            <div className="space-y-2">
              {list.map((campaign: PromoCampaignListItem) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => selectCampaign(campaign)}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left hover:bg-muted/50 ${
                    selectedId === campaign.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{campaign.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(campaign.createdAt)} · {segmentLabel(campaign.segment)}
                      {campaign.status === "Scheduled" && campaign.scheduledAt && (
                        <> · envio {formatDateTime(campaign.scheduledAt)}</>
                      )}
                    </p>
                  </div>
                  <Badge variant={statusVariant(campaign.status)}>
                    {statusLabel(campaign.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {campaign.sentCount}/{campaign.totalRecipients} enviados
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={editorRef}>
        {(isCreatingNew || isEditingDraft) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-5" />
                {isEditingDraft ? "Editar rascunho" : "Nova campanha de promoção"}
              </CardTitle>
              <CardDescription>
                {isEditingDraft
                  ? "Altere o texto e escolha enviar, agendar ou excluir."
                  : "Envia o template Meta kokoro_promocao_farmacia para um segmento de pacientes."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!templateReady && (
                <p className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                  Template de promoção não configurado. Cadastre e aprove{" "}
                  <strong>kokoro_promocao_farmacia</strong> em Admin → Templates Meta.
                </p>
              )}

              {!promoSenderConfigured && (
                <p className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                  Nenhum número WhatsApp de promoções configurado. Cadastre um remetente com finalidade{" "}
                  <strong>Promoções e campanhas</strong> ou{" "}
                  <strong>Adesão e promoções (mesmo número)</strong> em{" "}
                  <Link to="/whatsapp/configuracao" className="font-medium underline underline-offset-2">
                    WhatsApp → Configuração
                  </Link>
                  .
                </p>
              )}

              {isEditingDraft && selectedSummary && (
                <p className="text-sm text-muted-foreground">
                  Segmento: <strong>{segmentLabel(selectedSummary.segment)}</strong> ·{" "}
                  {selectedSummary.totalRecipients} destinatário(s)
                </p>
              )}

              {!isEditingDraft && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="promo-segment">Segmento</Label>
                    <Select value={segment} onValueChange={setSegment}>
                      <SelectTrigger id="promo-segment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {eligibleCountForSegment !== null && (
                      <p className="text-sm text-muted-foreground">
                        {eligibleCountForSegment === 0 ? (
                          <span className="text-amber-900 dark:text-amber-200">
                            Nenhum paciente elegível neste segmento.
                          </span>
                        ) : (
                          <>
                            <strong>{eligibleCountForSegment}</strong> paciente(s) elegível(is) neste
                            segmento.
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {segment === "PatientsOnMedication" && (
                    <div className="space-y-2">
                      <Label>Medicamento do catálogo</Label>
                      <Select value={segmentMedicationId} onValueChange={setSegmentMedicationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o medicamento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(medications.data ?? []).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.canonicalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promo-message">Texto da promoção (variável mensagem)</Label>
                  <Textarea
                    id="promo-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ex.: 20% de desconto em vitaminas até sexta-feira."
                  />
                </div>
                <WhatsAppMessagePreview
                  content={promoTemplateBody}
                  variables={promoPreviewVariables}
                  emptyLabel="Digite o texto da promoção para ver como o paciente receberá no WhatsApp."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promo-link">Botão de compra (opcional)</Label>
                  <Input
                    id="promo-link"
                    value={purchaseUrlSuffix}
                    onChange={(e) => setPurchaseUrlSuffix(e.target.value)}
                    placeholder="ex.: ofertas/vitaminas"
                  />
                  <p className="text-xs text-muted-foreground">
                    Parte final do link, anexada ao domínio fixo definido no botão do template Meta
                    (ex.: <code>sualoja.com.br/<strong>ofertas/vitaminas</strong></code>). Vazio = sem
                    botão de compra.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-coupon">Cupom de desconto (opcional)</Label>
                  <Input
                    id="promo-coupon"
                    value={couponCode}
                    maxLength={15}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="ex.: VITA20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Até 15 caracteres. Adiciona um botão <strong>Copiar cupom</strong>. Vazio = sem
                    botão de cupom.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promo-schedule-at">Agendar para</Label>
                <Input
                  id="promo-schedule-at"
                  type="datetime-local"
                  value={scheduleAtLocal}
                  onChange={(e) => setScheduleAtLocal(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {isEditingDraft ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!message.trim() || actionPending}
                    onClick={() => updateCampaign.mutate()}
                  >
                    Salvar alterações
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!formValid || actionPending}
                    onClick={() => createCampaign.mutate()}
                  >
                    Criar rascunho
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={(!formValid && !isEditingDraft) || actionPending || !scheduleAtLocal}
                  onClick={() => createAndSchedule.mutate()}
                >
                  <CalendarClock className="size-4" />
                  Agendar envio
                </Button>
                <Button
                  type="button"
                  disabled={(!formValid && !isEditingDraft) || actionPending}
                  onClick={() => createAndSend.mutate()}
                >
                  <Send className="size-4" />
                  Enviar agora
                </Button>
                {isEditingDraft && selectedId && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deactivateCampaign.isPending || deleteCampaign.isPending}
                      onClick={() => confirmDeactivate(selectedId, message)}
                    >
                      <XCircle className="size-4" />
                      Desativar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deactivateCampaign.isPending || deleteCampaign.isPending}
                      onClick={() => confirmDelete(selectedId, message)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedSummary && !isEditingDraft && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Campanha selecionada
                <Badge variant={statusVariant(selectedSummary.status)}>
                  {statusLabel(selectedSummary.status)}
                </Badge>
              </CardTitle>
              <CardDescription>
                {selectedSummary.status === "Scheduled" && selectedSummary.scheduledAt && (
                  <>Agendada para {formatDateTime(selectedSummary.scheduledAt)} · </>
                )}
                {selectedSummary.sentCount}/{selectedSummary.totalRecipients} enviados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{selectedSummary.message}</p>
              <WhatsAppMessagePreview
                content={promoTemplateBody}
                variables={{ nome: "Maria", mensagem: selectedSummary.message }}
              />
              <p className="text-sm text-muted-foreground">
                Segmento: {segmentLabel(selectedSummary.segment)}
              </p>
              {(selectedSummary.purchaseUrlSuffix || selectedSummary.couponCode) && (
                <div className="flex flex-wrap gap-2">
                  {selectedSummary.purchaseUrlSuffix && (
                    <Badge variant="outline">Botão de compra · …/{selectedSummary.purchaseUrlSuffix}</Badge>
                  )}
                  {selectedSummary.couponCode && (
                    <Badge variant="outline">Cupom · {selectedSummary.couponCode}</Badge>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedSummary.status === "Scheduled" && selectedId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cancelSchedule.isPending}
                    onClick={() => cancelSchedule.mutate(selectedId)}
                  >
                    <XCircle className="size-4" />
                    Cancelar agendamento
                  </Button>
                )}
                {canDeactivate(selectedSummary.status) && selectedId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deactivateCampaign.isPending || deleteCampaign.isPending}
                    onClick={() => confirmDeactivate(selectedId, selectedSummary.message)}
                  >
                    Desativar
                  </Button>
                )}
                {canDelete(selectedSummary.status) && selectedId && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deactivateCampaign.isPending || deleteCampaign.isPending}
                    onClick={() => confirmDelete(selectedId, selectedSummary.message)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>Destinatários</CardTitle>
            <CardDescription>
              {detail.data
                ? `${detail.data.sentCount} enviados · ${detail.data.failedCount} falhas · ${detail.data.skippedCount} ignorados`
                : "Carregando lista…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detail.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : detail.isError ? (
              <p className="text-sm text-destructive">Não foi possível carregar os destinatários.</p>
            ) : detail.data ? (
              <div className="max-h-80 space-y-1 overflow-y-auto text-sm">
                {detail.data.recipients.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum destinatário.</p>
                ) : (
                  detail.data.recipients.map((r) => (
                    <div
                      key={r.patientId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border px-2 py-1"
                    >
                      <span>{r.patientName ?? r.phone}</span>
                      <Badge variant="outline">{r.status}</Badge>
                      {r.errorMessage && (
                        <span className="w-full text-xs text-destructive">{r.errorMessage}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
