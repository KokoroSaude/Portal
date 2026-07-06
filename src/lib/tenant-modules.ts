import type { TenantModule, TenantSegment, TenantSettings, UserInfo } from "@/types/api";

const LEGACY_PICKUP_MODES = new Set(["GovPharmacy"]);

export function resolveEnabledModules(
  settings?: TenantSettings | null,
  user?: UserInfo | null,
): TenantModule[] {
  if (settings?.enabledModules && settings.enabledModules.length > 0) {
    return settings.enabledModules;
  }
  if (user?.enabledModules && user.enabledModules.length > 0) {
    return user.enabledModules;
  }
  const legacyMode = settings?.tenantOperationMode ?? user?.tenantOperationMode;
  if (legacyMode && LEGACY_PICKUP_MODES.has(legacyMode)) {
    return ["Adherence", "PharmacyPickup", "CareNetwork"];
  }
  return ["Adherence"];
}

export function resolveTenantSegment(
  settings?: TenantSettings | null,
  user?: UserInfo | null,
): TenantSegment {
  if (settings?.tenantSegment) return settings.tenantSegment;
  if (user?.tenantSegment) return user.tenantSegment;
  const legacyMode = settings?.tenantOperationMode ?? user?.tenantOperationMode;
  return legacyMode === "GovPharmacy" ? "PublicHealth" : "RetailPharmacy";
}

export function hasModule(
  module: TenantModule,
  settings?: TenantSettings | null,
  user?: UserInfo | null,
): boolean {
  return resolveEnabledModules(settings, user).includes(module);
}

export function canAccessPickup(
  hasFeature: (key: string) => boolean,
  settings?: TenantSettings | null,
  user?: UserInfo | null,
): boolean {
  return hasModule("PharmacyPickup", settings, user) && hasFeature("pharmacy.pickup");
}

export const SEGMENT_DEFAULT_MODULES: Record<TenantSegment, TenantModule[]> = {
  RetailPharmacy: ["Adherence"],
  PharmaIndustry: ["Adherence", "PatientSupportProgram"],
  HealthPlan: ["Adherence", "PopulationHealth"],
  PublicHealth: ["Adherence", "PharmacyPickup", "CareNetwork"],
};

export const PUBLIC_HEALTH_DEFAULT_HINTS: Partial<TenantSettings> = {
  requirePreRegisteredPatients: true,
  govPharmacyPickupEnabled: true,
  pickupQueuePrefix: "A",
  pickupNotificationLeadDays: 3,
  pickupMaxNotificationsPerDay: 10,
  pickupOrderExpiryDays: 7,
  pickupDefaultDailyDose: 1,
  pickupNoShowReminderEnabled: true,
  pickupMaxNoShowReminders: 2,
  pickupSusRulesEnabled: true,
  pickupSmartPriorityEnabled: true,
  pickupRunOutPriorityWeight: 10,
  pickupEmergencyReservePercent: 20,
  pickupCriticalWaitlistThreshold: 20,
  pickupBoostPriorityOnLowAdherence: true,
  pickupCsatEnabled: true,
  pickupNotificationRouting: "Both",
  adherenceNotificationRouting: "Both",
};
