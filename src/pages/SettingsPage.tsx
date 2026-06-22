import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Sparkles, Star } from "lucide-react";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import { SettingsUsersTab } from "@/components/settings/SettingsUsersTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getAiAvailability } from "@/lib/ai-status";
import { api, ApiClientError } from "@/lib/api";
import { normalizeVoiceToneSelectValue } from "@/lib/adminTemplateTones";
import { LOCALE_LABELS, VOICE_TONES, FEATURE_KEYS, TENANT_OPERATION_MODE_LABELS, PICKUP_NOTIFICATION_ROUTING_LABELS } from "@/lib/constants";
import { GOV_PHARMACY_DEFAULT_HINTS, isGovPharmacyMode } from "@/lib/gov-pharmacy";
import type { TenantSettings } from "@/types/api";

const SETTINGS_TABS = [
  "operacao",
  "ia",
  "engajamento",
  "onboarding",
  "pesquisas",
  "usuarios",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return SETTINGS_TABS.includes(value as SettingsTab);
}

function SettingsSaveButton({
  onSave,
  pending,
  label = "Salvar alterações",
}: {
  onSave: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <Button onClick={onSave} disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

export function SettingsPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<TenantSettings | null>(null);
  const [bulkCsatOpen, setBulkCsatOpen] = useState(false);
  const [bulkOnboardingOpen, setBulkOnboardingOpen] = useState(false);
  const tabParam = searchParams.get("tab");
  const defaultTab: SettingsTab =
    tabParam === "operacional" ? "operacao" : isSettingsTab(tabParam) ? tabParam : "operacao";

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(token!),
    enabled: !!token,
  });

  const { data: locales } = useQuery({
    queryKey: ["locales"],
    queryFn: () => api.getLocales(),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        voiceTone: normalizeVoiceToneSelectValue(settings.voiceTone),
        aiEnabled: settings.aiEnabled ?? false,
        voiceMessagesEnabled: settings.voiceMessagesEnabled ?? false,
        prescriptionScanEnabled: settings.prescriptionScanEnabled ?? false,
        voiceGender: settings.voiceGender ?? "Feminine",
        onboardingResumeEnabled: settings.onboardingResumeEnabled ?? true,
        onboardingResumeAfterDays: settings.onboardingResumeAfterDays ?? 2,
        onboardingResumeCooldownHours: settings.onboardingResumeCooldownHours ?? 24,
        onboardingSurveyRandomPickEnabled: settings.onboardingSurveyRandomPickEnabled ?? false,
        requirePreRegisteredPatients: settings.requirePreRegisteredPatients ?? false,
        defaultPromoMessage: settings.defaultPromoMessage ?? "",
        tenantOperationMode: settings.tenantOperationMode ?? "AdherenceProgram",
        govPharmacyPickupEnabled: settings.govPharmacyPickupEnabled ?? false,
        pickupQueuePrefix: settings.pickupQueuePrefix ?? "A",
        pickupAutoNotifyOnStockArrival: settings.pickupAutoNotifyOnStockArrival ?? false,
        pickupNotificationLeadDays: settings.pickupNotificationLeadDays ?? 3,
        pickupMaxNotificationsPerDay: settings.pickupMaxNotificationsPerDay ?? 10,
        pickupOrderExpiryDays: settings.pickupOrderExpiryDays ?? 7,
        pickupDefaultDailyDose: settings.pickupDefaultDailyDose ?? 1,
        pickupExpectedPickupDaysAfterNotify: settings.pickupExpectedPickupDaysAfterNotify ?? 0,
        pickupNoShowReminderEnabled: settings.pickupNoShowReminderEnabled ?? true,
        pickupMaxNoShowReminders: settings.pickupMaxNoShowReminders ?? 2,
        pickupIntegrationApiKey: settings.pickupIntegrationApiKey ?? "",
        pickupTvDisplayToken: settings.pickupTvDisplayToken ?? "",
        pickupCnesCode: settings.pickupCnesCode ?? "",
        pickupSusRulesEnabled: settings.pickupSusRulesEnabled ?? false,
        pickupQrCheckInEnabled: settings.pickupQrCheckInEnabled ?? false,
        pickupCheckInTokenTtlDays: settings.pickupCheckInTokenTtlDays ?? 7,
        pickupNotificationRouting: settings.pickupNotificationRouting ?? "Both",
        adherenceNotificationRouting: settings.adherenceNotificationRouting ?? "Both",
        pickupSmartPriorityEnabled: settings.pickupSmartPriorityEnabled ?? true,
        pickupRunOutPriorityWeight: settings.pickupRunOutPriorityWeight ?? 10,
        pickupEmergencyReservePercent: settings.pickupEmergencyReservePercent ?? 20,
        pickupCriticalWaitlistThreshold: settings.pickupCriticalWaitlistThreshold ?? 20,
        pickupBoostPriorityOnLowAdherence: settings.pickupBoostPriorityOnLowAdherence ?? true,
        pickupCsatEnabled: settings.pickupCsatEnabled ?? true,
        pickupDefaultWindowHours: settings.pickupDefaultWindowHours ?? 2,
        pickupMaxReschedulesPerOrder: settings.pickupMaxReschedulesPerOrder ?? 2,
        pickupArrivalOutsideWindowWarn: settings.pickupArrivalOutsideWindowWarn ?? true,
        pickupDuplicateDispenseAlertDays: settings.pickupDuplicateDispenseAlertDays ?? 7,
        pickupDelegateHighVolumeDailyLimit: settings.pickupDelegateHighVolumeDailyLimit ?? 5,
        pickupProcurementWebhookUrl: settings.pickupProcurementWebhookUrl ?? "",
      });
    }
  }, [settings]);

  const bulkOnboardingMutation = useMutation({
    mutationFn: () => api.triggerOnboardingResumeBulk(token!, { allOnboarding: true }),
    onSuccess: (result) => {
      setBulkOnboardingOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente com cadastro em andamento.");
        return;
      }
      toast.success(
        `Lembrete enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar lembrete de cadastro"),
  });

  const bulkCsatMutation = useMutation({
    mutationFn: () => api.triggerCsatBulk(token!, { allActive: true }),
    onSuccess: (result) => {
      setBulkCsatOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente ativo encontrado.");
        return;
      }
      toast.success(
        `Pesquisa enviada para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar pesquisa"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<TenantSettings>) => api.updateSettings(token!, payload),
    onSuccess: () => {
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar");
    },
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl">Configurações</h1>
          <p className="text-muted-foreground">Preferências da organização</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Configurações operacionais são gerenciadas pelo administrador da organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/perfil">Ir para meu perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function update<K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const save = () => saveMutation.mutate(form);
  const savePending = saveMutation.isPending;
  const govMode = isGovPharmacyMode(form);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Preferências operacionais da organização</p>
      </div>

      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="engajamento">Engajamento</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="pesquisas">Pesquisas</TabsTrigger>
          {hasFeature("users.manage") && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
        </TabsList>

        <TabsContent value="operacao" className="space-y-4">
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de organização</CardTitle>
              <CardDescription>
                Definido pelo administrador da plataforma no cadastro da organização. A equipe não
                pode alterar este tipo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={govMode ? "default" : "outline"}>
                {TENANT_OPERATION_MODE_LABELS[form.tenantOperationMode ?? "AdherenceProgram"] ??
                  "Programa de adesão"}
              </Badge>
              {govMode && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-medium text-foreground">Operação farmácia governamental (SUS)</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Pré-cadastro com CPF, nome e plano de cuidado</li>
                    <li>Prefixo de senha sugerido: {GOV_PHARMACY_DEFAULT_HINTS.pickupQueuePrefix}</li>
                    <li>
                      Aviso {GOV_PHARMACY_DEFAULT_HINTS.pickupNotificationLeadDays} dias antes do fim
                      do estoque
                    </li>
                    <li>Regras SUS e prioridade inteligente habilitadas</li>
                    <li>
                      Limite crítico da fila crônica:{" "}
                      {GOV_PHARMACY_DEFAULT_HINTS.pickupCriticalWaitlistThreshold} pacientes
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operação</CardTitle>
              <CardDescription>
                Janela de envio, follow-ups, tom de voz e acesso ao WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sendWindowStart">Início da janela de envio</Label>
                  <Input
                    id="sendWindowStart"
                    type="time"
                    value={form.sendWindowStart}
                    onChange={(e) => update("sendWindowStart", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendWindowEnd">Fim da janela de envio</Label>
                  <Input
                    id="sendWindowEnd"
                    type="time"
                    value={form.sendWindowEnd}
                    onChange={(e) => update("sendWindowEnd", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup">Follow-up após (horas)</Label>
                  <Input
                    id="followup"
                    type="number"
                    min={1}
                    value={form.followupAfterHours}
                    onChange={(e) => update("followupAfterHours", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reengagement">Tentativas de reengajamento</Label>
                  <Input
                    id="reengagement"
                    type="number"
                    min={0}
                    value={form.maxReengagementAttempts}
                    onChange={(e) => update("maxReengagementAttempts", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inactiveDays">Dias inativo antes de reengajar</Label>
                  <Input
                    id="inactiveDays"
                    type="number"
                    min={1}
                    value={form.inactiveDaysBeforeReengagement}
                    onChange={(e) =>
                      update("inactiveDaysBeforeReengagement", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tom de voz</Label>
                  <Select
                    value={normalizeVoiceToneSelectValue(form.voiceTone)}
                    onValueChange={(v) => update("voiceTone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={form.locale} onValueChange={(v) => update("locale", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(locales ?? []).map((code) => (
                        <SelectItem key={code} value={code}>
                          {LOCALE_LABELS[code] ?? code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="requirePreRegisteredPatients">Somente pacientes cadastrados</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativo, o WhatsApp só responde a números já cadastrados no portal. Novos
                    contatos precisam ser incluídos pela equipe antes de enviar mensagem.
                  </p>
                </div>
                <Switch
                  id="requirePreRegisteredPatients"
                  checked={form.requirePreRegisteredPatients ?? false}
                  onCheckedChange={(checked) => update("requirePreRegisteredPatients", checked)}
                />
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="defaultPromoMessage">Texto padrão de promoção</Label>
                <p className="text-sm text-muted-foreground">
                  Pré-preenche o inbox e campanhas de promoção (variável{" "}
                  <code className="text-xs">mensagem</code> do template Meta).
                </p>
                <Textarea
                  id="defaultPromoMessage"
                  rows={3}
                  value={form.defaultPromoMessage ?? ""}
                  onChange={(e) => update("defaultPromoMessage", e.target.value)}
                  placeholder="Ex.: 20% de desconto em vitaminas até sexta-feira."
                />
              </div>

              <SettingsSaveButton onSave={save} pending={savePending} />
            </CardContent>
          </Card>

          {govMode && (
            <Card>
              <CardHeader>
                <CardTitle>Retirada de medicamentos</CardTitle>
                <CardDescription>
                  Fila, notificações, integração ERP, painel TV e regras SUS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Prefixo da senha</Label>
                    <Input
                      value={form.pickupQueuePrefix ?? "A"}
                      onChange={(e) => update("pickupQueuePrefix", e.target.value)}
                      placeholder="A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias de antecedência do aviso</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.pickupNotificationLeadDays ?? 3}
                      onChange={(e) =>
                        update("pickupNotificationLeadDays", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. avisos por dia</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupMaxNotificationsPerDay ?? 10}
                      onChange={(e) =>
                        update("pickupMaxNotificationsPerDay", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiração da ordem (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupOrderExpiryDays ?? 7}
                      onChange={(e) => update("pickupOrderExpiryDays", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dose diária padrão</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupDefaultDailyDose ?? 1}
                      onChange={(e) => update("pickupDefaultDailyDose", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite fila crônica (alerta)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupCriticalWaitlistThreshold ?? 20}
                      onChange={(e) =>
                        update("pickupCriticalWaitlistThreshold", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNES</Label>
                    <Input
                      value={form.pickupCnesCode ?? ""}
                      onChange={(e) => update("pickupCnesCode", e.target.value)}
                      placeholder="0000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reserva emergencial (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={form.pickupEmergencyReservePercent ?? 20}
                      onChange={(e) =>
                        update("pickupEmergencyReservePercent", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso run-out (prioridade)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.pickupRunOutPriorityWeight ?? 10}
                      onChange={(e) =>
                        update("pickupRunOutPriorityWeight", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Janela padrão (horas)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={form.pickupDefaultWindowHours ?? 2}
                      onChange={(e) =>
                        update("pickupDefaultWindowHours", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. reagendamentos por ordem</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.pickupMaxReschedulesPerOrder ?? 2}
                      onChange={(e) =>
                        update("pickupMaxReschedulesPerOrder", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alerta dispensação duplicada (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupDuplicateDispenseAlertDays ?? 7}
                      onChange={(e) =>
                        update("pickupDuplicateDispenseAlertDays", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite diário delegate (alerta)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupDelegateHighVolumeDailyLimit ?? 5}
                      onChange={(e) =>
                        update("pickupDelegateHighVolumeDailyLimit", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Webhook pós-export compras</Label>
                    <Input
                      value={form.pickupProcurementWebhookUrl ?? ""}
                      onChange={(e) => update("pickupProcurementWebhookUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Roteamento — retirada</Label>
                    <Select
                      value={form.pickupNotificationRouting ?? "Both"}
                      onValueChange={(v) =>
                        update(
                          "pickupNotificationRouting",
                          v as TenantSettings["pickupNotificationRouting"],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PICKUP_NOTIFICATION_ROUTING_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Roteamento — adesão</Label>
                    <Select
                      value={form.adherenceNotificationRouting ?? "Both"}
                      onValueChange={(v) =>
                        update(
                          "adherenceNotificationRouting",
                          v as TenantSettings["adherenceNotificationRouting"],
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PICKUP_NOTIFICATION_ROUTING_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Chave API integração ERP</Label>
                    <PasswordInput
                      value={form.pickupIntegrationApiKey ?? ""}
                      onChange={(e) => update("pickupIntegrationApiKey", e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Token painel TV</Label>
                    <PasswordInput
                      value={form.pickupTvDisplayToken ?? ""}
                      onChange={(e) => update("pickupTvDisplayToken", e.target.value)}
                      placeholder="Token para /farmacia/tv"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["pickupAutoNotifyOnStockArrival", "Notificar ao receber lote"],
                      ["pickupNoShowReminderEnabled", "Lembrete de não-retirada"],
                      ["pickupSusRulesEnabled", "Regras SUS (CATMAT/CNES)"],
                      ["pickupQrCheckInEnabled", "Check-in por QR"],
                      ["pickupSmartPriorityEnabled", "Prioridade inteligente"],
                      ["pickupBoostPriorityOnLowAdherence", "Priorizar baixa adesão"],
                      ["pickupCsatEnabled", "CSAT pós-retirada"],
                      ["pickupArrivalOutsideWindowWarn", "Alerta chegada fora da janela"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                      <Label htmlFor={key}>{label}</Label>
                      <Switch
                        id={key}
                        checked={form[key] ?? false}
                        onCheckedChange={(checked) => update(key, checked)}
                      />
                    </div>
                  ))}
                </div>

                {form.pickupQrCheckInEnabled && (
                  <div className="max-w-xs space-y-2">
                    <Label>Validade token QR (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.pickupCheckInTokenTtlDays ?? 7}
                      onChange={(e) =>
                        update("pickupCheckInTokenTtlDays", Number(e.target.value))
                      }
                    />
                  </div>
                )}

                <SettingsSaveButton onSave={save} pending={savePending} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inteligência artificial</CardTitle>
              <CardDescription>
                NLU no WhatsApp, insights nos relatórios e personalização de marcos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasFeature(FEATURE_KEYS.aiCopilot) && settings && (
                <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <p className="text-sm font-medium">Status da IA neste tenant</p>
                    <PatientAiAvailabilityBadge settings={settings} canConfigureTenant />
                  </div>
                  {settings.aiFeatures?.platformConfigured === false && (
                    <p className="text-sm text-amber-900">
                      A chave do provedor (Claude ou OpenAI) ainda não está configurada na plataforma
                      Kokoro. Enquanto isso, o assistente usa apenas regras — mesmo com o toggle ligado.
                    </p>
                  )}
                  {getAiAvailability(settings) === "disabled" &&
                    settings.aiFeatures?.platformConfigured !== false && (
                      <p className="text-sm text-muted-foreground">
                        A plataforma está pronta. Ligue o toggle abaixo e salve para ativar IA no
                        WhatsApp e nos resumos.
                      </p>
                    )}
                  {getAiAvailability(settings) === "ready" && (
                    <p className="text-sm text-muted-foreground">
                      Tudo certo para IA. Na ficha do paciente, use{" "}
                      <strong>Atualizar assistente</strong> — o badge deve mostrar{" "}
                      <strong>Resumo: IA</strong>.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="aiEnabled">Ativar IA</Label>
                  <p className="text-sm text-muted-foreground">
                    Desligado usa apenas regras determinísticas no WhatsApp e nos relatórios.
                  </p>
                </div>
                <Switch
                  id="aiEnabled"
                  checked={form.aiEnabled}
                  onCheckedChange={(checked) => update("aiEnabled", checked)}
                />
              </div>

              {hasFeature(FEATURE_KEYS.whatsappVoice) && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="voiceMessagesEnabled">Mensagens em áudio (acessibilidade)</Label>
                      <p className="text-sm text-muted-foreground">
                        Permite cadastrar pacientes com canal Áudio. Respostas saem em voz quando
                        habilitado.
                      </p>
                    </div>
                    <Switch
                      id="voiceMessagesEnabled"
                      checked={form.voiceMessagesEnabled}
                      onCheckedChange={(checked) => update("voiceMessagesEnabled", checked)}
                    />
                  </div>
                  {form.voiceMessagesEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="voiceGender">Voz da farmácia</Label>
                      <Select
                        value={form.voiceGender ?? "Feminine"}
                        onValueChange={(v) =>
                          update("voiceGender", v as TenantSettings["voiceGender"])
                        }
                      >
                        <SelectTrigger id="voiceGender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Feminine">Feminina</SelectItem>
                          <SelectItem value="Masculine">Masculina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {hasFeature(FEATURE_KEYS.whatsappPrescription) && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="prescriptionScanEnabled">Leitura de receita (PDF/imagem)</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que pacientes enviem foto ou PDF de receita no WhatsApp. Medicamentos são
                      confirmados antes de cadastrar lembretes.
                    </p>
                  </div>
                  <Switch
                    id="prescriptionScanEnabled"
                    checked={form.prescriptionScanEnabled ?? false}
                    onCheckedChange={(checked) => update("prescriptionScanEnabled", checked)}
                    disabled={!form.aiEnabled}
                  />
                </div>
              )}

              <div className="space-y-2 rounded-lg border p-4">
                <Label htmlFor="outboundContentMode">Modo de conteúdo das mensagens</Label>
                <p className="text-sm text-muted-foreground">
                  Define como lembretes, follow-ups e respostas da farmácia são gerados. Fora da janela
                  de 24h, mensagens usam template Meta aprovado.
                </p>
                <Select
                  value={form.outboundContentMode ?? "TemplateOnly"}
                  onValueChange={(v) =>
                    update("outboundContentMode", v as TenantSettings["outboundContentMode"])
                  }
                >
                  <SelectTrigger id="outboundContentMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TemplateOnly">Somente template</SelectItem>
                    <SelectItem value="AiOnly">Somente IA</SelectItem>
                    <SelectItem value="Alternate">Intercalar template e IA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(form.outboundContentMode ?? "TemplateOnly") === "Alternate" && (
                <div className="space-y-2 rounded-lg border p-4">
                  <Label htmlFor="outboundAlternateStrategy">Regra de intercalação</Label>
                  <Select
                    value={form.outboundAlternateStrategy ?? "PerPatient"}
                    onValueChange={(v) =>
                      update(
                        "outboundAlternateStrategy",
                        v as TenantSettings["outboundAlternateStrategy"],
                      )
                    }
                  >
                    <SelectTrigger id="outboundAlternateStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PerPatient">Por paciente (alterna a cada envio)</SelectItem>
                      <SelectItem value="PerMessageKind">Por tipo de mensagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <SettingsSaveButton onSave={save} pending={savePending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engajamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nudge comportamental</CardTitle>
              <CardDescription>
                Reforço positivo variado, normas sociais nos marcos e limite de mensagens de empatia.
                {" "}
                <a
                  href="https://kokorosaude.com.br/nudge"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Ver princípios
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="nudgesEnabled">Nudges ativos</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch para reforço, variáveis de progresso e telemetria.
                  </p>
                </div>
                <Switch
                  id="nudgesEnabled"
                  checked={form.nudgesEnabled ?? true}
                  onCheckedChange={(checked) => update("nudgesEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="positiveReinforcementPoolEnabled">Pool de reforço positivo</Label>
                  <p className="text-sm text-muted-foreground">
                    Rotaciona 6 variantes após check-in SIM (sem repetir a última).
                  </p>
                </div>
                <Switch
                  id="positiveReinforcementPoolEnabled"
                  checked={form.positiveReinforcementPoolEnabled ?? true}
                  onCheckedChange={(checked) => update("positiveReinforcementPoolEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="socialNormNudgesEnabled">Normas sociais (cohort)</Label>
                  <p className="text-sm text-muted-foreground">
                    Frases ascendentes nos marcos D14/D30 quando há amostra suficiente.
                  </p>
                </div>
                <Switch
                  id="socialNormNudgesEnabled"
                  checked={form.socialNormNudgesEnabled ?? false}
                  onCheckedChange={(checked) => update("socialNormNudgesEnabled", checked)}
                />
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="maxEmpathyBlocksPerWeek">Máx. blocos de empatia / semana</Label>
                <Input
                  id="maxEmpathyBlocksPerWeek"
                  type="number"
                  min={1}
                  max={7}
                  value={form.maxEmpathyBlocksPerWeek ?? 3}
                  onChange={(e) => update("maxEmpathyBlocksPerWeek", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gamificação</CardTitle>
              <CardDescription>
                Progresso visível no WhatsApp, conquistas e resumo diário opcional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="progressMenuEnabled">Menu &quot;Meu progresso&quot;</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe sequência, adesão e próximo marco no menu ativo do WhatsApp.
                  </p>
                </div>
                <Switch
                  id="progressMenuEnabled"
                  checked={form.progressMenuEnabled ?? true}
                  onCheckedChange={(checked) => update("progressMenuEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="achievementsEnabled">Conquistas</Label>
                  <p className="text-sm text-muted-foreground">
                    Badges automáticos após check-ins (streak, comeback, marcos).
                  </p>
                </div>
                <Switch
                  id="achievementsEnabled"
                  checked={form.achievementsEnabled ?? true}
                  onCheckedChange={(checked) => update("achievementsEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="dailySummaryEnabled">Resumo diário (21h)</Label>
                  <p className="text-sm text-muted-foreground">
                    Envia resumo do dia para pacientes ativos com check-in no dia.
                  </p>
                </div>
                <Switch
                  id="dailySummaryEnabled"
                  checked={form.dailySummaryEnabled ?? false}
                  onCheckedChange={(checked) => update("dailySummaryEnabled", checked)}
                />
              </div>

              <SettingsSaveButton onSave={save} pending={savePending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro pendente no WhatsApp</CardTitle>
              <CardDescription>
                Para quem começou o cadastro pelo WhatsApp e parou no meio — sem terminar nome,
                medicamento ou horários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="onboardingResumeEnabled">Lembrete automático</Label>
                  <p className="text-sm text-muted-foreground">
                    A Kokoro reenvia no WhatsApp a próxima pergunta do cadastro quando o paciente fica
                    alguns dias sem responder.
                  </p>
                </div>
                <Switch
                  id="onboardingResumeEnabled"
                  checked={form.onboardingResumeEnabled}
                  onCheckedChange={(checked) => update("onboardingResumeEnabled", checked)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onboardingResumeAfterDays">Esperar antes de lembrar (dias)</Label>
                  <Input
                    id="onboardingResumeAfterDays"
                    type="number"
                    min={0}
                    value={form.onboardingResumeAfterDays}
                    onChange={(e) => update("onboardingResumeAfterDays", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Só envia lembrete se o paciente ficar esse tempo sem responder no WhatsApp.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboardingResumeCooldownHours">Intervalo entre lembretes (horas)</Label>
                  <Input
                    id="onboardingResumeCooldownHours"
                    type="number"
                    min={0}
                    value={form.onboardingResumeCooldownHours}
                    onChange={(e) =>
                      update("onboardingResumeCooldownHours", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo mínimo entre um lembrete e outro para o mesmo paciente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SettingsSaveButton
                  onSave={save}
                  pending={savePending}
                  label="Salvar lembretes automáticos"
                />
                <Dialog open={bulkOnboardingOpen} onOpenChange={setBulkOnboardingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={bulkOnboardingMutation.isPending}>
                      <RefreshCw className="size-4" />
                      Lembrar todos com cadastro em andamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lembrar todos com cadastro em andamento?</DialogTitle>
                      <DialogDescription>
                        Cada paciente que ainda não terminou o cadastro receberá no WhatsApp a pergunta
                        em que parou. Quem não puder receber agora será ignorado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkOnboardingOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkOnboardingMutation.mutate()}
                        disabled={bulkOnboardingMutation.isPending}
                      >
                        {bulkOnboardingMutation.isPending ? "Enviando…" : "Enviar lembretes"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <p className="text-sm text-muted-foreground">
                O envio manual é imediato: use{" "}
                <span className="font-medium text-foreground">Continuar cadastro</span> na ficha do
                paciente ou na lista de pacientes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalas no fim do cadastro</CardTitle>
              <CardDescription>
                Quando MMAS-8 e TCP estão habilitados no onboarding, evita enviar as duas pesquisas
                seguidas para o mesmo paciente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="onboardingSurveyRandomPickEnabled">
                    Escolher uma escala por paciente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ativo: cada paciente recebe só MMAS-8 ou só TCP ao concluir o cadastro (escolha
                    estável). Desligado: aplica as duas em sequência.
                  </p>
                </div>
                <Switch
                  id="onboardingSurveyRandomPickEnabled"
                  checked={form.onboardingSurveyRandomPickEnabled ?? false}
                  onCheckedChange={(checked) =>
                    update("onboardingSurveyRandomPickEnabled", checked)
                  }
                />
              </div>

              <SettingsSaveButton
                onSave={save}
                pending={savePending}
                label="Salvar escalas no cadastro"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pesquisas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisa de satisfação (CSAT)</CardTitle>
              <CardDescription>
                Dispare manualmente a pergunta de 1 a 5 no WhatsApp — por paciente, seleção na lista
                ou todos os ativos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={bulkCsatOpen} onOpenChange={setBulkCsatOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={bulkCsatMutation.isPending}>
                    <Star className="size-4" />
                    Enviar para todos os pacientes ativos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar CSAT para todos os ativos?</DialogTitle>
                    <DialogDescription>
                      Cada paciente com status Ativo receberá a pesquisa no WhatsApp. Quem já tiver
                      pesquisa pendente ou estiver em check-in/MMAS-8 será ignorado.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkCsatOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => bulkCsatMutation.mutate()}
                      disabled={bulkCsatMutation.isPending}
                    >
                      {bulkCsatMutation.isPending ? "Enviando…" : "Confirmar envio"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {hasFeature("users.manage") && (
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Convide e gerencie acessos da organização</CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsUsersTab />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
