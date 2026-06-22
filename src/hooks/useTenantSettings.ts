import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { isGovPharmacyMode } from "@/lib/gov-pharmacy";
import type { TenantOperationMode, TenantSettings } from "@/types/api";

export function tenantSettingsQueryKey(tenantId?: string | null) {
  return ["settings", tenantId ?? "unknown"] as const;
}

function authTenantOperationMode(
  mode?: TenantOperationMode | string | null,
): TenantOperationMode | undefined {
  if (mode === "GovPharmacy" || mode === "AdherenceProgram") return mode;
  return undefined;
}

function resolvePickupAccess(
  authMode: TenantOperationMode | undefined,
  settings: TenantSettings | undefined,
  settingsLoaded: boolean,
): boolean {
  if (settingsLoaded && settings) {
    return isGovPharmacyMode(settings);
  }
  return authMode === "GovPharmacy";
}

export function useTenantSettings() {
  const { token, auth } = useAuth();
  const tenantId = auth?.user?.tenantId ?? null;
  const authMode = authTenantOperationMode(auth?.user?.tenantOperationMode);

  const query = useQuery({
    queryKey: tenantSettingsQueryKey(tenantId),
    queryFn: () => api.getSettings(token!),
    enabled: !!token && !!tenantId,
  });

  const settings = query.data;
  const govMode = resolvePickupAccess(authMode, settings, query.isSuccess);
  const pickupAccess = govMode;

  return {
    ...query,
    settings,
    govMode,
    authMode,
    pickupAccess,
  };
}
