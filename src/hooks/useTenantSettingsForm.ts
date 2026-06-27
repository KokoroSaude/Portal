import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { tenantSettingsQueryKey } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { normalizeVoiceToneSelectValue } from "@/lib/adminTemplateTones";
import type { TenantSettings } from "@/types/api";

function normalizeSettings(settings: TenantSettings): TenantSettings {
  return {
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
  };
}

export function useTenantSettingsForm() {
  const { token, auth } = useAuth();
  const tenantId = auth?.user?.tenantId ?? null;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TenantSettings | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: tenantSettingsQueryKey(tenantId),
    queryFn: () => api.getSettings(token!),
    enabled: !!token && !!tenantId,
  });

  useEffect(() => {
    if (settings) {
      setForm(normalizeSettings(settings));
    }
  }, [settings]);

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

  function update<K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function save() {
    if (form) saveMutation.mutate(form);
  }

  return {
    settings,
    form,
    update,
    save,
    savePending: saveMutation.isPending,
    isLoading,
  };
}
