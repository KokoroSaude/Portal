import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Megaphone, RefreshCw, Send, XCircle } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PromoCampaignListItem } from "@/types/api";

const SEGMENTS = [
  { value: "ActivePatients", label: "Pacientes ativos" },
  { value: "AllEligible", label: "Todos elegíveis (exceto onboarding e opt-out)" },
  { value: "PatientsOnMedication", label: "Pacientes em um medicamento (catálogo)" },
] as const;

function statusVariant(status: string): "default" | "secondary" | "outline" | "warning" {
  switch (status) {
    case "Completed":
      return "secondary";
    case "Sending":
      return "default";
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
      return "Cancelada";
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
  const [message, setMessage] = useState("");
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

  useEffect(() => {
    if (defaults.data?.defaultMessage && !message) {
      setMessage(defaults.data.defaultMessage);
    }
  }, [defaults.data?.defaultMessage, message]);

  useEffect(() => {
    if (detail.data?.status === "Draft") {
      setScheduleAtLocal(defaultScheduleLocal());
    }
  }, [detail.data?.status, selectedId]);

  const invalidateCampaign = () => {
    void queryClient.invalidateQueries({ queryKey: ["promo-campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["promo-campaign", selectedId] });
  };

  const createCampaign = useMutation({
    mutationFn: () =>
      api.createPromoCampaign(token!, {
        message: message.trim(),
        segment,
        segmentMedicationId:
          segment === "PatientsOnMedication" ? segmentMedicationId || undefined : undefined,
      }),
    onSuccess: (result) => {
      toast.success(`Campanha criada — ${result.totalRecipients} destinatário(s)`);
      setSelectedId(result.campaignId);
      void queryClient.invalidateQueries({ queryKey: ["promo-campaigns"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar campanha"),
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

  const list = campaigns.data ?? [];
  const templateReady = defaults.data?.promotionTemplateConfigured ?? false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5" />
            Nova campanha de promoção
          </CardTitle>
          <CardDescription>
            Envia o template Meta <code className="text-xs">kokoro_promocao_farmacia</code> para um
            segmento de pacientes. Respeita opt-out e envia com intervalo entre mensagens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!templateReady && (
            <p className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
              Template de promoção não configurado. Cadastre e aprove{" "}
              <strong>kokoro_promocao_farmacia</strong> em Admin → Templates Meta.
            </p>
          )}
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
          <Button
            type="button"
            disabled={
              !message.trim() ||
              !templateReady ||
              createCampaign.isPending ||
              (segment === "PatientsOnMedication" && !segmentMedicationId)
            }
            onClick={() => createCampaign.mutate()}
          >
            Criar rascunho
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Campanhas</CardTitle>
            <CardDescription>Histórico e status de envio</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={campaigns.isFetching}
            onClick={() => void campaigns.refetch()}
          >
            <RefreshCw className={campaigns.isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
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
                  onClick={() => setSelectedId(campaign.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{campaign.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(campaign.createdAt)} · {campaign.segment}
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

      {selectedId && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Detalhes</CardTitle>
              {detail.data && (
                <CardDescription className="mt-1">
                  {detail.data.status === "Scheduled" && detail.data.scheduledAt && (
                    <>
                      Agendada para {formatDateTime(detail.data.scheduledAt)} ·{" "}
                    </>
                  )}
                  {detail.data.sentCount} enviados · {detail.data.failedCount} falhas ·{" "}
                  {detail.data.skippedCount} ignorados
                </CardDescription>
              )}
            </div>
            {detail.data?.status === "Draft" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={scheduleCampaign.isPending || !templateReady || !scheduleAtLocal}
                  onClick={() =>
                    scheduleCampaign.mutate({
                      campaignId: selectedId,
                      scheduledAt: localDatetimeToUtcIso(scheduleAtLocal),
                    })
                  }
                >
                  <CalendarClock className="size-4" />
                  Agendar envio
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={sendCampaign.isPending || !templateReady}
                  onClick={() => sendCampaign.mutate(selectedId)}
                >
                  <Send className="size-4" />
                  Enviar agora
                </Button>
              </div>
            )}
            {detail.data?.status === "Scheduled" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={cancelSchedule.isPending}
                onClick={() => cancelSchedule.mutate(selectedId)}
              >
                <XCircle className="size-4" />
                Cancelar agendamento
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {detail.data?.status === "Draft" && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <Label htmlFor="promo-schedule-at">Data e hora do envio</Label>
                <Input
                  id="promo-schedule-at"
                  type="datetime-local"
                  value={scheduleAtLocal}
                  onChange={(e) => setScheduleAtLocal(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Horário local do seu navegador. Fora da janela de envio da clínica, o disparo
                  aguarda o próximo horário permitido.
                </p>
              </div>
            )}
            {detail.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : detail.data ? (
              <div className="max-h-80 space-y-1 overflow-y-auto text-sm">
                {detail.data.recipients.map((r) => (
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
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
