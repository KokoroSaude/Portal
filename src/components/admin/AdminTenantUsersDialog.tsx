import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ROLE_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatDateTime } from "@/lib/utils";
import type { AdminTenant } from "@/types/api";

type Props = {
  tenant: AdminTenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminTenantUsersDialog({ tenant, open, onOpenChange }: Props) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; email: string } | null>(null);

  const tenantId = tenant?.id ?? "";

  const users = useQuery({
    queryKey: ["admin-tenant-users", tenantId],
    queryFn: () => api.adminListTenantUsers(token!, tenantId),
    enabled: !!token && !!tenantId && open,
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.adminUpdateTenantUser(token!, tenantId, userId, isActive),
    onSuccess: () => {
      toast.success("Usuário atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-users", tenantId] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.adminSetTenantUserPassword(token!, tenantId, passwordUserId!, newPassword),
    onSuccess: () => {
      toast.success("Senha alterada");
      setPasswordUserId(null);
      setNewPassword("");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.adminDeleteTenantUser(token!, tenantId, userId),
    onSuccess: () => {
      toast.success("Usuário excluído");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-users", tenantId] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const filteredUsers = useMemo(
    () =>
      (users.data ?? []).filter((u) =>
        matchesGridSearch(
          query,
          u.name,
          u.email,
          u.role,
          ROLE_LABELS[u.role],
          u.isActive ? "ativo" : "inativo",
        ),
      ),
    [users.data, query],
  );

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPasswordUserId(null);
      setNewPassword("");
      setDeleteTarget(null);
      setInput("");
    }
    onOpenChange(next);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usuários do tenant</DialogTitle>
            <DialogDescription>
              {tenant ? (
                <>
                  {tenant.name} <span className="font-mono text-xs">({tenant.slug})</span>
                </>
              ) : (
                "Selecione um tenant"
              )}
            </DialogDescription>
          </DialogHeader>

          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome, e-mail ou papel"
            resultCount={filteredUsers.length}
            totalCount={users.data?.length}
          />

          {users.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 && (
                  <GridEmptyRow
                    colSpan={6}
                    message={
                      query.trim()
                        ? "Nenhum usuário corresponde à busca."
                        : "Nenhum usuário neste tenant."
                    }
                  />
                )}
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "muted"}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPasswordUserId(u.id);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="size-4" />
                          Senha
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ userId: u.id, isActive: !u.isActive })
                          }
                        >
                          {u.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ id: u.id, name: u.name, email: u.email })}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordUserId !== null}
        onOpenChange={(v) => {
          if (!v) {
            setPasswordUserId(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário do tenant (mínimo 8 caracteres).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-new-password">Nova senha</Label>
            <Input
              id="admin-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => passwordMutation.mutate()}
              disabled={newPassword.length < 8 || passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "Salvando…" : "Salvar senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário do tenant</DialogTitle>
            <DialogDescription>
              Remover permanentemente <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
