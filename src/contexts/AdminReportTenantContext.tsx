import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";

type AdminReportTenantContextValue = {
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  tenantFilter: string[] | undefined;
  canFetch: boolean;
  selectedTenantNames: string[];
  tenantsLoading: boolean;
};

const AdminReportTenantContext = createContext<AdminReportTenantContextValue | null>(null);

export function AdminReportTenantProvider({ children }: { children: ReactNode }) {
  const { tenants: activeTenants, isLoading: tenantsLoading } = useActiveAdminTenants();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (activeTenants.length > 0 && !initialized) {
      setSelectedIds(new Set(activeTenants.map((t) => t.id)));
      setInitialized(true);
    }
  }, [activeTenants, initialized]);

  useEffect(() => {
    const activeIds = new Set(activeTenants.map((t) => t.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => activeIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [activeTenants]);

  const tenantFilter = useMemo(() => {
    if (selectedIds.size === 0) return undefined;
    return Array.from(selectedIds);
  }, [selectedIds]);

  const selectedTenantNames = useMemo(
    () => activeTenants.filter((t) => selectedIds.has(t.id)).map((t) => t.name),
    [activeTenants, selectedIds],
  );

  const value = useMemo(
    () => ({
      selectedIds,
      setSelectedIds,
      tenantFilter,
      canFetch: selectedIds.size > 0,
      selectedTenantNames,
      tenantsLoading,
    }),
    [selectedIds, tenantFilter, selectedTenantNames, tenantsLoading],
  );

  return (
    <AdminReportTenantContext.Provider value={value}>
      {children}
    </AdminReportTenantContext.Provider>
  );
}

export function useAdminReportTenants() {
  const ctx = useContext(AdminReportTenantContext);
  if (!ctx) {
    throw new Error("useAdminReportTenants must be used within AdminReportTenantProvider");
  }
  return ctx;
}
