import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  canAccessPickup,
  hasModule,
  resolveEnabledModules,
  resolveTenantSegment,
} from "@/lib/tenant-modules";
import type { TenantModule, TenantSegment, TenantSettings } from "@/types/api";

export function tenantSettingsQueryKey(tenantId?: string | null) {
  return ["settings", tenantId ?? "unknown"] as const;
}

export function useTenantSettings() {
  const { token, auth, hasFeature } = useAuth();
  const tenantId = auth?.user?.tenantId ?? null;
  const user = auth?.user ?? null;

  const query = useQuery({
    queryKey: tenantSettingsQueryKey(tenantId),
    queryFn: () => api.getSettings(token!),
    enabled: !!token && !!tenantId,
  });

  const settings = query.data;
  const segment = resolveTenantSegment(settings, user ?? undefined);
  const enabledModules = resolveEnabledModules(settings, user ?? undefined);
  const pickupAccess = canAccessPickup(hasFeature, settings, user ?? undefined);
  const govMode = hasModule("PharmacyPickup", settings, user ?? undefined);

  const moduleEnabled = (module: TenantModule) =>
    hasModule(module, settings, user ?? undefined);

  return {
    ...query,
    settings,
    segment,
    enabledModules,
    govMode,
    pickupAccess,
    hasModule: moduleEnabled,
  };
}

export type { TenantSegment, TenantSettings };
