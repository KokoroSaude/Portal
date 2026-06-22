import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { canAccessPickup, isGovPharmacyMode } from "@/lib/gov-pharmacy";

export function tenantSettingsQueryKey(tenantId?: string | null) {
  return ["settings", tenantId ?? "unknown"] as const;
}

export function useTenantSettings() {
  const { token, auth } = useAuth();
  const tenantId = auth?.user?.tenantId ?? null;

  const query = useQuery({
    queryKey: tenantSettingsQueryKey(tenantId),
    queryFn: () => api.getSettings(token!),
    enabled: !!token && !!tenantId,
  });

  const settings = query.data;
  const govMode = isGovPharmacyMode(settings);
  const pickupAccess = canAccessPickup(() => false, settings);

  return {
    ...query,
    settings,
    govMode,
    /** Só true quando settings carregaram e a org é farmácia gov. */
    pickupAccess: query.isSuccess ? pickupAccess : false,
  };
}
