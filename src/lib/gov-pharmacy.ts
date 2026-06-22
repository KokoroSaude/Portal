import { FEATURE_KEYS } from "@/lib/constants";
import type { TenantSettings } from "@/types/api";

export function isGovPharmacyMode(settings?: TenantSettings | null): boolean {
  const mode = settings?.tenantOperationMode;
  return mode === "GovPharmacy" || settings?.govPharmacyPickupEnabled === true;
}

export function canAccessPickup(
  hasFeature: (key: string) => boolean,
  settings?: TenantSettings | null,
): boolean {
  return hasFeature(FEATURE_KEYS.pharmacyPickup) || isGovPharmacyMode(settings);
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
