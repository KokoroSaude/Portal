import type { AdminTenant, TenantOperationMode } from "@/types/api";

type RawAdminTenant = Partial<AdminTenant> & {
  Id?: string;
  Name?: string;
  Slug?: string;
  PlanId?: string;
  PlanKey?: string;
  TenantOperationMode?: TenantOperationMode;
  GovPharmacyPickupEnabled?: boolean;
  IsActive?: boolean;
  AiEnabled?: boolean;
  CreatedAt?: string;
};

export function normalizeAdminTenant(raw: RawAdminTenant): AdminTenant {
  return {
    id: raw.id ?? raw.Id ?? "",
    name: raw.name ?? raw.Name ?? "",
    slug: raw.slug ?? raw.Slug ?? "",
    planId: raw.planId ?? raw.PlanId ?? "",
    planKey: raw.planKey ?? raw.PlanKey ?? "",
    tenantOperationMode:
      raw.tenantOperationMode ?? raw.TenantOperationMode ?? "AdherenceProgram",
    govPharmacyPickupEnabled:
      raw.govPharmacyPickupEnabled ?? raw.GovPharmacyPickupEnabled ?? false,
    isActive: raw.isActive ?? raw.IsActive ?? false,
    aiEnabled: raw.aiEnabled ?? raw.AiEnabled ?? false,
    createdAt: raw.createdAt ?? raw.CreatedAt ?? "",
  };
}
