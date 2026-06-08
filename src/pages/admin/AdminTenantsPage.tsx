import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminTenantUsersDialog } from "@/components/admin/AdminTenantUsersDialog";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import type { AdminTenant } from "@/types/api";

export function AdminTenantsPage() {
  const { token, impersonateTenant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [usersTenant, setUsersTenant] = useState<AdminTenant | null>(null);

  const tenants = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  const aiMutation = useMutation({
    mutationFn: ({ tenantId, aiEnabled }: { tenantId: string; aiEnabled: boolean }) =>
      api.adminUpdateTenantAi(token!, tenantId, aiEnabled),
    onSuccess: () => {
      toast.success("IA da organização atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ tenantId, isActive }: { tenantId: string; isActive: boolean }) =>
      api.adminUpdateTenantStatus(token!, tenantId, isActive),
    onSuccess: () => {
      toast.success("Status da organização atualizado");
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
      matchesGridSearch(query, t.name, t.slug, t.isActive ? "ativo" : "inativo"),
    );
  }, [tenants.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Organizações" description="Farmácias e clínicas cadastradas na plataforma" />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Todas as organizações</CardTitle>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome ou slug"
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
                  <TableHead>Status</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead />
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 && (
                  <GridEmptyRow
                    colSpan={7}
                    message={
                      query.trim()
                        ? "Nenhuma organização corresponde à busca."
                        : "Nenhuma organização cadastrada."
                    }
                  />
                )}
                {filteredTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? "success" : "muted"}>
                        {t.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.aiEnabled}
                        disabled={aiMutation.isPending}
                        onCheckedChange={(checked) =>
                          aiMutation.mutate({ tenantId: t.id, aiEnabled: checked })
                        }
                        aria-label={`IA ${t.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({ tenantId: t.id, isActive: !t.isActive })
                        }
                      >
                        {t.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsersTenant(t)}
                      >
                        <Users className="size-4" />
                        Usuários
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!t.isActive || impersonateMutation.isPending}
                        onClick={() => impersonateMutation.mutate(t.id)}
                      >
                        <Eye className="size-4" />
                        Entrar como organização
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminTenantUsersDialog
        tenant={usersTenant}
        open={usersTenant !== null}
        onOpenChange={(open) => !open && setUsersTenant(null)}
      />
    </div>
  );
}
