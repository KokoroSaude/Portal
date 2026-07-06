import type { TenantSettings } from "@/types/api";
import {
  canAccessPickup as canAccessPickupModule,
  hasModule,
  resolveTenantSegment,
  PUBLIC_HEALTH_DEFAULT_HINTS,
} from "@/lib/tenant-modules";

/** @deprecated Use hasModule(settings, user, "PharmacyPickup") */
export function isGovPharmacyMode(settings?: TenantSettings | null): boolean {
  return hasModule("PharmacyPickup", settings);
}

export function canAccessPickup(
  hasFeature: (key: string) => boolean,
  settings?: TenantSettings | null,
): boolean {
  return canAccessPickupModule(hasFeature, settings);
}

export const GOV_PHARMACY_DEFAULT_HINTS = PUBLIC_HEALTH_DEFAULT_HINTS;

export { hasModule, resolveTenantSegment };
