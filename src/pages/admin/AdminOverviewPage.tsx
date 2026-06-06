import { useQuery } from "@tanstack/react-query";
import { Building2, Layers, Users } from "lucide-react";
import { GettingStartedCard } from "@/components/guide/GettingStartedCard";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function AdminOverviewPage() {
  const { token } = useAuth();

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
        <CardHeader>
          <CardTitle>Tenants recentes</CardTitle>
          <CardDescription>Organizações cadastradas na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {tenants.data?.slice(0, 8).map((t) => (
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
