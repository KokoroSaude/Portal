import type { AdminTenant } from "@/types/api";

/** Organizações desabilitadas só aparecem na listagem admin (/admin/tenants). */
export function activeAdminTenants(tenants: AdminTenant[] | undefined): AdminTenant[] {
  return (tenants ?? []).filter((t) => t.isActive);
}
