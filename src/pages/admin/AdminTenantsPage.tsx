import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AdminTenantFormDialog,
  type AdminTenantCreateForm,
  type AdminTenantEditForm,
} from "@/components/admin/AdminTenantFormDialog";
import { AdminTenantUsersDialog } from "@/components/admin/AdminTenantUsersDialog";
import { AdminTenantDeletionDialog } from "@/components/admin/AdminTenantDeletionDialog";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
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
import { useAdminTenantsList } from "@/hooks/useAdminTenants";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { matchesGridSearch } from "@/lib/gridSearch";
import { TENANT_SEGMENT_LABELS } from "@/lib/constants";
import type { AdminTenant } from "@/types/api";

function planLabel(planKey: string) {
  return planKey.charAt(0).toUpperCase() + planKey.slice(1);
}

export function AdminTenantsPage() {
  const { token, impersonateTenant } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [usersTenant, setUsersTenant] = useState<AdminTenant | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<AdminTenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<AdminTenant | null>(null);

  const tenants = useAdminTenantsList();

  const createMutation = useMutation({
    mutationFn: (form: AdminTenantCreateForm) =>
      api.adminCreateTenant(token!, {
        name: form.name,
        slug: form.slug,
        planId: form.planId,
        tenantSegment: form.tenantSegment,
        enabledModules: form.enabledModules,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        isActive: form.isActive,
        aiEnabled: form.aiEnabled,
      }),
    onSuccess: () => {
      toast.success("Organização criada");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { tenantId: string; form: AdminTenantEditForm }) =>
      api.adminUpdateTenant(token!, payload.tenantId, payload.form),
    onSuccess: () => {
      toast.success("Organização atualizada");
      setEditTenant(null);
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar"),
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
    onSuccess: (_data, variables) => {
      toast.success(
        variables.isActive
          ? "Organização reativada"
          : "Organização desabilitada — não aparecerá em relatórios nem seletores",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { tenantId: string; confirmSlug: string; totpCode: string }) =>
      api.adminSoftDeleteTenant(
        token!,
        payload.tenantId,
        payload.confirmSlug,
        payload.totpCode,
      ),
    onSuccess: () => {
      toast.success("Organização excluída — disponível para restauração por 30 dias");
      setDeleteTenant(null);
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-deleted-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir"),
  });

  function handleToggleStatus(tenant: AdminTenant) {
    if (tenant.isActive) {
      const ok = window.confirm(
        `Desabilitar "${tenant.name}"?\n\nA organização continuará visível apenas nesta listagem. Relatórios, métricas e seletores não a incluirão. Usuários não conseguirão entrar no portal.`,
      );
      if (!ok) return;
      statusMutation.mutate({ tenantId: tenant.id, isActive: false });
      return;
    }
    statusMutation.mutate({ tenantId: tenant.id, isActive: true });
  }

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
      matchesGridSearch(query, t.name, t.slug, t.planKey, t.isActive ? "ativo" : "inativo"),
    );
  }, [tenants.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizações"
        description="Farmácias e clínicas cadastradas na plataforma"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nova organização
          </Button>
        }
      />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Todas as organizações</CardTitle>
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
          ) : tenants.isError ? (
            <QueryErrorState
              message="Não foi possível carregar as organizações."
              error={tenants.error}
              onRetry={() => void tenants.refetch()}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead />
                  <TableHead />
                  <TableHead />
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 && (
                  <GridEmptyRow
                    colSpan={10}
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
                      <Badge variant="outline">{planLabel(t.planKey)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TENANT_SEGMENT_LABELS[t.tenantSegment] ?? t.tenantSegment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? "success" : "muted"}>
                        {t.isActive ? "Ativa" : "Desabilitada"}
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
                        variant={t.isActive ? "outline" : "default"}
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => handleToggleStatus(t)}
                      >
                        {t.isActive ? "Desabilitar" : "Reativar"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setEditTenant(t)}>
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setUsersTenant(t)}>
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
                        Entrar
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTenant(t)}
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminTenantFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        loading={createMutation.isPending}
        onSubmit={(form) => createMutation.mutate(form)}
      />

      <AdminTenantFormDialog
        mode="edit"
        open={editTenant !== null}
        onOpenChange={(open) => !open && setEditTenant(null)}
        tenant={editTenant}
        loading={updateMutation.isPending}
        onSubmit={(form) => {
          if (!editTenant) return;
          updateMutation.mutate({ tenantId: editTenant.id, form });
        }}
      />

      <AdminTenantUsersDialog
        tenant={usersTenant}
        open={usersTenant !== null}
        onOpenChange={(open) => !open && setUsersTenant(null)}
      />

      <AdminTenantDeletionDialog
        tenant={deleteTenant}
        open={deleteTenant !== null}
        onOpenChange={(open) => !open && setDeleteTenant(null)}
        mode="soft-delete"
        loading={deleteMutation.isPending}
        onConfirm={(confirmSlug, totpCode) => {
          if (!deleteTenant) return;
          deleteMutation.mutate({ tenantId: deleteTenant.id, confirmSlug, totpCode });
        }}
      />
    </div>
  );
}
