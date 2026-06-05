import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { PlanFeatureUpdate, TenantFeature } from "@/types/api";

export function AdminPlanFeaturesPage() {
  const { planId } = useParams<{ planId: string }>();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<TenantFeature[]>([]);

  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.adminListPlans(token!),
    enabled: !!token,
  });

  const plan = plans.data?.find((p) => p.id === planId);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plan-features", planId],
    queryFn: () => api.adminGetPlanFeatures(token!, planId!),
    enabled: !!token && !!planId,
  });

  useEffect(() => {
    if (data) setFeatures(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: PlanFeatureUpdate[] = features.map((f) => ({
        featureKey: f.key,
        enabled: f.enabled,
        limitValue: f.limitValue,
      }));
      return api.adminUpdatePlanFeatures(token!, planId!, payload);
    },
    onSuccess: () => {
      toast.success("Features atualizadas");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-features", planId] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  function toggle(key: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    );
  }

  const grouped = features.reduce<Record<string, TenantFeature[]>>((acc, f) => {
    (acc[f.category] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Link to="/admin/planos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Planos
      </Link>
      <PageHeader
        title={plan?.name ?? "Plano"}
        description={`Features habilitadas para o plano ${plan?.key ?? ""}`}
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {Object.entries(grouped).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((f) => (
                  <label key={f.key} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                    <Checkbox checked={f.enabled} onCheckedChange={() => toggle(f.key)} />
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{f.key}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="size-4" />
            Salvar features
          </Button>
        </>
      )}
    </div>
  );
}
