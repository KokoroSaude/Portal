import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { activeAdminTenants } from "@/lib/admin-tenants";
import type { AdminTenant } from "@/types/api";

/** Lista completa (ativas + desabilitadas) — usar só em /admin/tenants. */
export function useAdminTenantsList() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });
}

/** Somente organizações ativas — relatórios, overview, seletores. */
export function useActiveAdminTenants(): {
  tenants: AdminTenant[];
  isLoading: boolean;
  isError: boolean;
} {
  const query = useAdminTenantsList();
  const tenants = useMemo(() => activeAdminTenants(query.data), [query.data]);
  return { tenants, isLoading: query.isLoading, isError: query.isError };
}
