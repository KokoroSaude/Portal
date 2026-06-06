import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { matchesGridSearch } from "@/lib/gridSearch";

export function AdminTenantsPage() {
  const { token, impersonateTenant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();

  const tenants = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  const plans = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.adminListPlans(token!),
    enabled: !!token,
  });

  const assignMutation = useMutation({
    mutationFn: ({ tenantId, planId }: { tenantId: string; planId: string }) =>
      api.adminAssignTenantPlan(token!, tenantId, planId),
    onSuccess: () => {
      toast.success("Plano atribuído");
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const impersonateMutation = useMutation({
    mutationFn: (tenantId: string) => impersonateTenant(tenantId),
    onSuccess: () => {
      toast.success("Impersonação iniciada");
      navigate("/");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const filteredTenants = useMemo(() => {
    const all = tenants.data ?? [];
    return all.filter((t) =>
      matchesGridSearch(query, t.name, t.slug, t.planName, t.isActive ? "ativo" : "inativo"),
    );
  }, [tenants.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" description="Organizações e planos de assinatura" />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Todos os tenants</CardTitle>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome, slug ou plano"
            resultCount={filteredTenants.length}
            totalCount={tenants.data?.length}
          />
        </CardHeader>
        <CardContent>
          {tenants.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alterar plano</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 && (
                  <GridEmptyRow
                    colSpan={6}
                    message={
                      query.trim()
                        ? "Nenhum tenant corresponde à busca."
                        : "Nenhum tenant cadastrado."
                    }
                  />
                )}
                {filteredTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                    <TableCell>{t.planName}</TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? "success" : "muted"}>
                        {t.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(planId) =>
                          assignMutation.mutate({ tenantId: t.id, planId })
                        }
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Trocar plano" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.data?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!t.isActive || impersonateMutation.isPending}
                        onClick={() => impersonateMutation.mutate(t.id)}
                      >
                        <Eye className="size-4" />
                        Entrar como tenant
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
