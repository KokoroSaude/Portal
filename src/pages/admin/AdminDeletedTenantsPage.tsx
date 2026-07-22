import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTenantDeletionDialog } from "@/components/admin/AdminTenantDeletionDialog";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils";
import type { AdminDeletedTenant } from "@/types/api";

export function AdminDeletedTenantsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [purgeTarget, setPurgeTarget] = useState<AdminDeletedTenant | null>(null);

  const deleted = useQuery({
    queryKey: ["admin-deleted-tenants"],
    queryFn: () => api.adminListDeletedTenants(token!),
    enabled: !!token,
  });

  const restoreMutation = useMutation({
    mutationFn: (tenantId: string) => api.adminRestoreTenant(token!, tenantId),
    onSuccess: () => {
      toast.success("Organização restaurada");
      queryClient.invalidateQueries({ queryKey: ["admin-deleted-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao restaurar"),
  });

  const purgeMutation = useMutation({
    mutationFn: (payload: { tenantId: string; confirmSlug: string; totpCode: string }) =>
      api.adminPurgeTenant(token!, payload.tenantId, payload.confirmSlug, payload.totpCode),
    onSuccess: () => {
      toast.success("Organização removida permanentemente");
      setPurgeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-deleted-tenants"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir"),
  });

  const filtered = useMemo(() => {
    const all = deleted.data ?? [];
    return all.filter((t) =>
      matchesGridSearch(query, t.name, t.slug, String(t.daysRemaining)),
    );
  }, [deleted.data, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizações excluídas"
        description="Organizações em período de retenção de 30 dias — restaure ou exclua permanentemente"
      />

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Retenção ativa</CardTitle>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome ou slug"
            resultCount={filtered.length}
            totalCount={deleted.data?.length}
          />
        </CardHeader>
        <CardContent>
          {deleted.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : deleted.isError ? (
            <QueryErrorState
              message="Não foi possível carregar as organizações excluídas."
              error={deleted.error}
              onRetry={() => void deleted.refetch()}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Excluída em</TableHead>
                  <TableHead>Dias restantes</TableHead>
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <GridEmptyRow
                    colSpan={6}
                    message={
                      query.trim()
                        ? "Nenhuma organização corresponde à busca."
                        : "Nenhuma organização excluída no momento."
                    }
                  />
                )}
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                    <TableCell>{formatDate(t.deletedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={t.daysRemaining <= 7 ? "warning" : "muted"}>
                        {t.daysRemaining} {t.daysRemaining === 1 ? "dia" : "dias"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoreMutation.isPending}
                        onClick={() => restoreMutation.mutate(t.id)}
                      >
                        <Undo2 className="mr-1 size-4" />
                        Restaurar
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setPurgeTarget(t)}
                      >
                        <Trash2 className="mr-1 size-4" />
                        Excluir permanentemente
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminTenantDeletionDialog
        tenant={purgeTarget}
        open={purgeTarget !== null}
        onOpenChange={(open) => !open && setPurgeTarget(null)}
        mode="purge"
        loading={purgeMutation.isPending}
        onConfirm={(confirmSlug, totpCode) => {
          if (!purgeTarget) return;
          purgeMutation.mutate({ tenantId: purgeTarget.id, confirmSlug, totpCode });
        }}
      />
    </div>
  );
}
