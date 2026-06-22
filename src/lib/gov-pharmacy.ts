import type { TenantSettings } from "@/types/api";

export function isGovPharmacyMode(settings?: TenantSettings | null): boolean {
  return settings?.tenantOperationMode === "GovPharmacy";
}

/** Módulo /farmacia e retirada SUS — apenas organizações em modo farmácia governamental. */
export function canAccessPickup(
  _hasFeature: (key: string) => boolean,
  settings?: TenantSettings | null,
): boolean {
  return isGovPharmacyMode(settings);
}

export const GOV_PHARMACY_DEFAULT_HINTS: Partial<TenantSettings> = {
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
