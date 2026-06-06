import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Building2, Layers, Users } from "lucide-react";
import { GettingStartedCard } from "@/components/guide/GettingStartedCard";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api } from "@/lib/api";
import { matchesGridSearch } from "@/lib/gridSearch";

export function AdminOverviewPage() {
  const { token } = useAuth();
  const { input, setInput, query } = useGridSearch();

  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.adminListPlans(token!),
    enabled: !!token,
  });

  const tenants = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  const loading = plans.isLoading || tenants.isLoading;
  const activePlans = plans.data?.filter((p) => p.isActive).length ?? 0;
  const activeTenants = tenants.data?.filter((t) => t.isActive).length ?? 0;

  const filteredRecentTenants = useMemo(() => {
    const all = tenants.data ?? [];
    return all
      .filter((t) => matchesGridSearch(query, t.name, t.slug, t.planName))
      .slice(0, 8);
  }, [tenants.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Superadmin"
        description="Gestão de planos, tenants e features da plataforma Kokoro"
      />

      <GettingStartedCard />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={Layers} label="Planos ativos" value={activePlans} sub={`${plans.data?.length ?? 0} total`} />
          <Stat icon={Building2} label="Tenants ativos" value={activeTenants} sub={`${tenants.data?.length ?? 0} total`} />
          <Stat
            icon={Users}
            label="Tenants no Enterprise"
            value={tenants.data?.filter((t) => t.planKey === "enterprise").length ?? 0}
            sub="plano enterprise"
          />
        </div>
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Tenants recentes</CardTitle>
            <CardDescription>Organizações cadastradas na plataforma</CardDescription>
          </div>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar tenants por nome, slug ou plano"
            resultCount={filteredRecentTenants.length}
            totalCount={tenants.data?.length}
          />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {filteredRecentTenants.length === 0 && (
              <li className="py-6 text-center text-muted-foreground">
                {query.trim() ? "Nenhum tenant corresponde à busca." : "Nenhum tenant cadastrado."}
              </li>
            )}
            {filteredRecentTenants.map((t) => (
              <li key={t.id} className="flex justify-between rounded-lg border px-3 py-2">
                <span>
                  {t.name} <span className="text-muted-foreground">({t.slug})</span>
                </span>
                <span className="text-muted-foreground">{t.planName}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
