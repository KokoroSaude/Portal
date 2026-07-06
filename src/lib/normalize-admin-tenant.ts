import type { AdminTenant, TenantModule, TenantOperationMode, TenantSegment } from "@/types/api";
import { SEGMENT_DEFAULT_MODULES } from "@/lib/tenant-modules";

type RawAdminTenant = Partial<AdminTenant> & {
  Id?: string;
  Name?: string;
  Slug?: string;
  PlanId?: string;
  PlanKey?: string;
  TenantSegment?: TenantSegment;
  EnabledModules?: TenantModule[];
  TenantOperationMode?: TenantOperationMode;
  GovPharmacyPickupEnabled?: boolean;
  IsActive?: boolean;
  AiEnabled?: boolean;
  CreatedAt?: string;
};

export function normalizeAdminTenant(raw: RawAdminTenant): AdminTenant {
  const segment =
    raw.tenantSegment ??
    raw.TenantSegment ??
    (raw.tenantOperationMode === "GovPharmacy" || raw.TenantOperationMode === "GovPharmacy"
      ? "PublicHealth"
      : "RetailPharmacy");

  return {
    id: raw.id ?? raw.Id ?? "",
    name: raw.name ?? raw.Name ?? "",
    slug: raw.slug ?? raw.Slug ?? "",
    planId: raw.planId ?? raw.PlanId ?? "",
    planKey: raw.planKey ?? raw.PlanKey ?? "",
    tenantSegment: segment,
    enabledModules:
      raw.enabledModules ??
      raw.EnabledModules ??
      SEGMENT_DEFAULT_MODULES[segment],
    tenantOperationMode:
      raw.tenantOperationMode ?? raw.TenantOperationMode ?? "AdherenceProgram",
    govPharmacyPickupEnabled:
      raw.govPharmacyPickupEnabled ?? raw.GovPharmacyPickupEnabled ?? false,
    isActive: raw.isActive ?? raw.IsActive ?? false,
    aiEnabled: raw.aiEnabled ?? raw.AiEnabled ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
  };
}
