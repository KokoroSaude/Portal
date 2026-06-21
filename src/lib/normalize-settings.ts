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
    aiFeatures,
  };
}
