import type { AiPlatformFeatures, TenantSettings } from "@/types/api";

type RawAiFeatures = AiPlatformFeatures & {
  PlatformConfigured?: boolean;
  InsightsEnabled?: boolean;
  OutboundPersonalizationEnabled?: boolean;
  MilestonePersonalizationEnabled?: boolean;
  InterventionsEnabled?: boolean;
  CheckinFallbackEnabled?: boolean;
};

type RawTenantSettings = TenantSettings & {
  AiFeatures?: RawAiFeatures;
  AiEnabled?: boolean;
  OutboundContentMode?: TenantSettings["outboundContentMode"];
  OutboundAlternateStrategy?: TenantSettings["outboundAlternateStrategy"];
  TenantOperationMode?: TenantSettings["tenantOperationMode"];
  GovPharmacyPickupEnabled?: boolean;
  PickupQueuePrefix?: string;
  PickupAutoNotifyOnStockArrival?: boolean;
  PickupNotificationLeadDays?: number;
  PickupMaxNotificationsPerDay?: number;
  PickupOrderExpiryDays?: number;
  PickupDefaultDailyDose?: number;
  PickupExpectedPickupDaysAfterNotify?: number;
  PickupNoShowReminderEnabled?: boolean;
  PickupMaxNoShowReminders?: number;
  PickupIntegrationApiKey?: string | null;
  PickupTvDisplayToken?: string | null;
  PickupCnesCode?: string | null;
  PickupSusRulesEnabled?: boolean;
  PickupQrCheckInEnabled?: boolean;
  PickupCheckInTokenTtlDays?: number;
  PickupNotificationRouting?: TenantSettings["pickupNotificationRouting"];
  AdherenceNotificationRouting?: TenantSettings["adherenceNotificationRouting"];
  PickupSmartPriorityEnabled?: boolean;
  PickupRunOutPriorityWeight?: number;
  PickupEmergencyReservePercent?: number;
  PickupCriticalWaitlistThreshold?: number;
  PickupBoostPriorityOnLowAdherence?: boolean;
  PickupCsatEnabled?: boolean;
  PickupDefaultWindowHours?: number;
  PickupMaxReschedulesPerOrder?: number;
  PickupArrivalOutsideWindowWarn?: boolean;
  PickupDuplicateDispenseAlertDays?: number;
  PickupDelegateHighVolumeDailyLimit?: number;
  PickupProcurementWebhookUrl?: string | null;
};

function normalizeAiFeatures(raw?: RawAiFeatures | null): AiPlatformFeatures | undefined {
  if (!raw) return undefined;

  return {
    platformConfigured: raw.platformConfigured ?? raw.PlatformConfigured ?? false,
    insightsEnabled: raw.insightsEnabled ?? raw.InsightsEnabled ?? true,
    outboundPersonalizationEnabled:
      raw.outboundPersonalizationEnabled ?? raw.OutboundPersonalizationEnabled ?? true,
    milestonePersonalizationEnabled:
      raw.milestonePersonalizationEnabled ?? raw.MilestonePersonalizationEnabled ?? true,
    interventionsEnabled: raw.interventionsEnabled ?? raw.InterventionsEnabled ?? true,
    checkinFallbackEnabled: raw.checkinFallbackEnabled ?? raw.CheckinFallbackEnabled ?? true,
  };
}

export function normalizeTenantSettings(raw: RawTenantSettings): TenantSettings {
  const aiFeatures = normalizeAiFeatures(raw.aiFeatures ?? raw.AiFeatures);

  return {
    ...raw,
    aiEnabled: raw.aiEnabled ?? raw.AiEnabled ?? false,
    outboundContentMode: raw.outboundContentMode ?? raw.OutboundContentMode ?? "TemplateOnly",
    outboundAlternateStrategy:
      raw.outboundAlternateStrategy ?? raw.OutboundAlternateStrategy ?? "PerPatient",
    onboardingResumeEnabled: raw.onboardingResumeEnabled ?? true,
    onboardingSurveyRandomPickEnabled: raw.onboardingSurveyRandomPickEnabled ?? false,
    tenantOperationMode: raw.tenantOperationMode ?? raw.TenantOperationMode ?? "AdherenceProgram",
    govPharmacyPickupEnabled: raw.govPharmacyPickupEnabled ?? raw.GovPharmacyPickupEnabled ?? false,
    pickupQueuePrefix: raw.pickupQueuePrefix ?? raw.PickupQueuePrefix ?? "A",
    pickupAutoNotifyOnStockArrival:
      raw.pickupAutoNotifyOnStockArrival ?? raw.PickupAutoNotifyOnStockArrival ?? false,
    pickupNotificationLeadDays:
      raw.pickupNotificationLeadDays ?? raw.PickupNotificationLeadDays ?? 3,
    pickupMaxNotificationsPerDay:
      raw.pickupMaxNotificationsPerDay ?? raw.PickupMaxNotificationsPerDay ?? 10,
    pickupOrderExpiryDays: raw.pickupOrderExpiryDays ?? raw.PickupOrderExpiryDays ?? 7,
    pickupDefaultDailyDose: raw.pickupDefaultDailyDose ?? raw.PickupDefaultDailyDose ?? 1,
    pickupExpectedPickupDaysAfterNotify:
      raw.pickupExpectedPickupDaysAfterNotify ?? raw.PickupExpectedPickupDaysAfterNotify ?? 0,
    pickupNoShowReminderEnabled:
      raw.pickupNoShowReminderEnabled ?? raw.PickupNoShowReminderEnabled ?? true,
    pickupMaxNoShowReminders: raw.pickupMaxNoShowReminders ?? raw.PickupMaxNoShowReminders ?? 2,
    pickupIntegrationApiKey: raw.pickupIntegrationApiKey ?? raw.PickupIntegrationApiKey ?? null,
    pickupTvDisplayToken: raw.pickupTvDisplayToken ?? raw.PickupTvDisplayToken ?? null,
    pickupCnesCode: raw.pickupCnesCode ?? raw.PickupCnesCode ?? null,
    pickupSusRulesEnabled: raw.pickupSusRulesEnabled ?? raw.PickupSusRulesEnabled ?? false,
    pickupQrCheckInEnabled: raw.pickupQrCheckInEnabled ?? raw.PickupQrCheckInEnabled ?? false,
    pickupCheckInTokenTtlDays:
      raw.pickupCheckInTokenTtlDays ?? raw.PickupCheckInTokenTtlDays ?? 7,
    pickupNotificationRouting:
      raw.pickupNotificationRouting ?? raw.PickupNotificationRouting ?? "Both",
    adherenceNotificationRouting:
      raw.adherenceNotificationRouting ?? raw.AdherenceNotificationRouting ?? "Both",
    pickupSmartPriorityEnabled:
      raw.pickupSmartPriorityEnabled ?? raw.PickupSmartPriorityEnabled ?? true,
    pickupRunOutPriorityWeight:
      raw.pickupRunOutPriorityWeight ?? raw.PickupRunOutPriorityWeight ?? 10,
    pickupEmergencyReservePercent:
      raw.pickupEmergencyReservePercent ?? raw.PickupEmergencyReservePercent ?? 20,
    pickupCriticalWaitlistThreshold:
      raw.pickupCriticalWaitlistThreshold ?? raw.PickupCriticalWaitlistThreshold ?? 20,
    pickupBoostPriorityOnLowAdherence:
      raw.pickupBoostPriorityOnLowAdherence ?? raw.PickupBoostPriorityOnLowAdherence ?? true,
    pickupCsatEnabled: raw.pickupCsatEnabled ?? raw.PickupCsatEnabled ?? true,
    pickupDefaultWindowHours:
      raw.pickupDefaultWindowHours ?? raw.PickupDefaultWindowHours ?? 2,
    pickupMaxReschedulesPerOrder:
      raw.pickupMaxReschedulesPerOrder ?? raw.PickupMaxReschedulesPerOrder ?? 2,
    pickupArrivalOutsideWindowWarn:
      raw.pickupArrivalOutsideWindowWarn ?? raw.PickupArrivalOutsideWindowWarn ?? true,
    pickupDuplicateDispenseAlertDays:
      raw.pickupDuplicateDispenseAlertDays ?? raw.PickupDuplicateDispenseAlertDays ?? 7,
    pickupDelegateHighVolumeDailyLimit:
      raw.pickupDelegateHighVolumeDailyLimit ?? raw.PickupDelegateHighVolumeDailyLimit ?? 5,
    pickupProcurementWebhookUrl:
      raw.pickupProcurementWebhookUrl ?? raw.PickupProcurementWebhookUrl ?? null,
    aiFeatures,
  };
}
