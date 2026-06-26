import type { AdminDeletedTenant } from "@/types/api";

type RawAdminDeletedTenant = Partial<AdminDeletedTenant> & {
  Id?: string;
  Name?: string;
  Slug?: string;
  DeletedAt?: string;
  PermanentDeleteScheduledAt?: string;
  DaysRemaining?: number;
};

export function normalizeAdminDeletedTenant(raw: RawAdminDeletedTenant): AdminDeletedTenant {
  return {
    id: raw.id ?? raw.Id ?? "",
    name: raw.name ?? raw.Name ?? "",
    slug: raw.slug ?? raw.Slug ?? "",
    deletedAt: raw.deletedAt ?? raw.DeletedAt ?? "",
    permanentDeleteScheduledAt:
      raw.permanentDeleteScheduledAt ?? raw.PermanentDeleteScheduledAt ?? "",
    daysRemaining: raw.daysRemaining ?? raw.DaysRemaining ?? 0,
  };
}
