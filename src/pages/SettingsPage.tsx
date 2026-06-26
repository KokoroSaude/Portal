import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SettingsUsersTab } from "@/components/settings/SettingsUsersTab";
import { SettingsPickupTab } from "@/components/settings/SettingsPickupTab";
import { SettingsOperationTab } from "@/components/settings/SettingsOperationTab";
import { SettingsAiTab } from "@/components/settings/SettingsAiTab";
import { SettingsEngagementTab } from "@/components/settings/SettingsEngagementTab";
import { SettingsOnboardingTab } from "@/components/settings/SettingsOnboardingTab";
import { SettingsSurveysTab } from "@/components/settings/SettingsSurveysTab";
import { SettingsComplianceTab } from "@/components/settings/SettingsComplianceTab";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { tenantSettingsQueryKey } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { normalizeVoiceToneSelectValue } from "@/lib/adminTemplateTones";
import { TENANT_OPERATION_MODE_LABELS } from "@/lib/constants";
import { GOV_PHARMACY_DEFAULT_HINTS, isGovPharmacyMode } from "@/lib/gov-pharmacy";
import type { TenantSettings } from "@/types/api";

const SETTINGS_TABS = [
  "operacao",
  "ia",
  "engajamento",
  "onboarding",
  "pesquisas",
  "privacidade",
  "usuarios",
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return SETTINGS_TABS.includes(value as SettingsTab);
}

export function SettingsPage() {
  const { token, isAdmin, hasFeature, auth } = useAuth();
  const tenantId = auth?.user?.tenantId ?? null;
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<TenantSettings | null>(null);
  const [bulkCsatOpen, setBulkCsatOpen] = useState(false);
  const [bulkOnboardingOpen, setBulkOnboardingOpen] = useState(false);
  const tabParam = searchParams.get("tab");
  const defaultTab: SettingsTab =
    tabParam === "operacional" ? "operacao" : isSettingsTab(tabParam) ? tabParam : "operacao";

  const { data: settings, isLoading } = useQuery({
    queryKey: tenantSettingsQueryKey(tenantId),
    queryFn: () => api.getSettings(token!),
    enabled: !!token && !!tenantId,
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
        pickupErpAllowedIps: settings.pickupErpAllowedIps ?? "",
        pickupErpSandboxMode: settings.pickupErpSandboxMode ?? false,
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
      queryClient.invalidateQueries({ queryKey: tenantSettingsQueryKey(tenantId) });
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
          <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
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
              <CardDescription>Janela de envio, follow-ups, tom de voz e acesso ao WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingsOperationTab form={form} locales={locales} update={update} />
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
                <SettingsPickupTab form={form} update={update} />
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
              <SettingsAiTab
                form={form}
                settings={settings!}
                hasFeature={hasFeature}
                update={update}
              />
              <SettingsSaveButton onSave={save} pending={savePending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engajamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engajamento</CardTitle>
              <CardDescription>
                Nudge comportamental e gamificação no WhatsApp.{" "}
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
              <SettingsEngagementTab form={form} update={update} />
              <SettingsSaveButton onSave={save} pending={savePending} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
              <CardDescription>
                Cadastro pendente no WhatsApp e escalas ao concluir o cadastro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsOnboardingTab
                form={form}
                update={update}
                save={save}
                savePending={savePending}
                bulkOnboardingOpen={bulkOnboardingOpen}
                setBulkOnboardingOpen={setBulkOnboardingOpen}
                bulkOnboardingPending={bulkOnboardingMutation.isPending}
                onBulkOnboarding={() => bulkOnboardingMutation.mutate()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pesquisas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pesquisa de satisfação (CSAT)</CardTitle>
              <CardDescription>
                Configure o envio periódico ou dispare manualmente a pergunta de 1 a 5 no WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsSurveysTab
                form={form}
                update={update}
                save={save}
                savePending={savePending}
                bulkCsatOpen={bulkCsatOpen}
                setBulkCsatOpen={setBulkCsatOpen}
                bulkCsatPending={bulkCsatMutation.isPending}
                onBulkCsat={() => bulkCsatMutation.mutate()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacidade" className="space-y-4">
          <SettingsComplianceTab token={token!} settings={settings!} />
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
