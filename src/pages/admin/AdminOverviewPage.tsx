import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, TrendingUp, UserCheck } from "lucide-react";
import { GettingStartedCard } from "@/components/guide/GettingStartedCard";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api } from "@/lib/api";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatDateTime } from "@/lib/utils";

export function AdminOverviewPage() {
  const { token } = useAuth();
  const { input, setInput, query } = useGridSearch();

  const { tenants: activeTenantsList, isLoading } = useActiveAdminTenants();

  const productMetrics = useQuery({
    queryKey: ["admin-product-metrics"],
    queryFn: () => api.adminGetProductMetrics(token!),
    enabled: !!token,
  });

  const loading = isLoading;
  const activeTenants = activeTenantsList.length;

  const filteredRecentTenants = useMemo(() => {
    return [...activeTenantsList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((t) => matchesGridSearch(query, t.name, t.slug))
      .slice(0, 8);
  }, [activeTenantsList, query]);

  return (
    <div className="space-y-6">
      <GettingStartedCard />

      <PageHeader
        title="Superadmin"
        description="Gestão de organizações e operação da plataforma Kokoro"
      />

      <Card>
        <CardHeader>
          <CardTitle>Métricas de produto</CardTitle>
          <CardDescription>Contagens agregadas da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {productMetrics.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : productMetrics.isError ? (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as métricas de produto.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat
                icon={Building2}
                label="Organizações ativas"
                value={productMetrics.data?.activeTenants ?? 0}
                sub="organizações ativas"
              />
              <Stat
                icon={UserCheck}
                label="Pacientes ativos"
                value={productMetrics.data?.activePatients ?? 0}
                sub="em rotina de cuidado"
              />
              <Stat
                icon={TrendingUp}
                label="Onboardings esta semana"
                value={productMetrics.data?.onboardingsThisWeek ?? 0}
                sub="novas organizações"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-28 w-full max-w-sm" />
      ) : (
        <Stat
          icon={Building2}
          label="Organizações ativas"
          value={activeTenants}
          sub={`${activeTenantsList.length} ativas`}
        />
      )}

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Organizações recentes</CardTitle>
            <CardDescription>Cadastros mais recentes na plataforma</CardDescription>
          </div>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar organizações por nome ou slug"
            resultCount={filteredRecentTenants.length}
            totalCount={activeTenantsList.length}
          />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {filteredRecentTenants.length === 0 && (
              <li className="py-6 text-center text-muted-foreground">
                {query.trim()
                  ? "Nenhuma organização corresponde à busca."
                  : "Nenhuma organização cadastrada."}
              </li>
            )}
            {filteredRecentTenants.map((t) => (
              <li key={t.id}>
                <Link
                  to="/admin/tenants"
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <span>
                    {t.name}{" "}
                    <span className="text-muted-foreground">({t.slug})</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="hidden text-xs sm:inline">
                      {formatDateTime(t.createdAt)}
                    </span>
                    <ChevronRight className="size-4" />
                  </span>
                </Link>
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
