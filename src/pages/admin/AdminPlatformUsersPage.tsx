import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { formatDateTime } from "@/lib/utils";
import type { AdminPlatformUser } from "@/types/api";

type CreateForm = { name: string; email: string; password: string };
type EditForm = { name: string; email: string; isActive: boolean };

const emptyCreate: CreateForm = { name: "", email: "", password: "" };

function toEditForm(user: AdminPlatformUser): EditForm {
  return { name: user.name, email: user.email, isActive: user.isActive };
}

export function AdminPlatformUsersPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [editUser, setEditUser] = useState<AdminPlatformUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const users = useQuery({
    queryKey: ["admin-platform-users"],
    queryFn: () => api.adminListPlatformUsers(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.adminCreatePlatformUser(token!, createForm.name, createForm.email, createForm.password),
    onSuccess: () => {
      toast.success("Superadmin criado");
      setCreateForm(emptyCreate);
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-platform-users"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name: string; email: string; isActive: boolean }) =>
      api.adminUpdatePlatformUser(token!, payload.id, {
        name: payload.name,
        email: payload.email,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      toast.success("Superadmin atualizado");
      setEditUser(null);
      setEditForm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-platform-users"] });
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
          u.isActive ? "ativo" : "inativo",
        ),
      ),
    [users.data, query],
  );

  const canCreate =
    createForm.name.trim() && createForm.email.trim() && createForm.password.trim();

  const canSaveEdit =
    editForm &&
    editForm.name.trim() &&
    editForm.email.trim() &&
    (editUser?.name !== editForm.name.trim() ||
      editUser.email !== editForm.email.trim() ||
      editUser.isActive !== editForm.isActive);

  function openEdit(user: AdminPlatformUser) {
    setEditUser(user);
    setEditForm(toEditForm(user));
  }

  function closeEdit() {
    setEditUser(null);
    setEditForm(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Superadmins" description="Usuários com acesso à plataforma Kokoro" />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="min-w-0 flex-1 space-y-4">
            <CardTitle>Todos os superadmins</CardTitle>
            <GridSearchBar
              value={input}
              onChange={setInput}
              placeholder="Buscar por nome ou e-mail"
              resultCount={filteredUsers.length}
              totalCount={users.data?.length}
            />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Novo usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar superadmin</DialogTitle>
                <DialogDescription>
                  A senha inicial é definida aqui. Depois, cada usuário altera a própria senha em Meu perfil.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-user-name">Nome</Label>
                  <Input
                    id="platform-user-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-user-email">E-mail</Label>
                  <Input
                    id="platform-user-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-user-password">Senha inicial</Label>
                  <Input
                    id="platform-user-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!canCreate || createMutation.isPending}
                >
                  {createMutation.isPending ? "Criando…" : "Criar usuário"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {users.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 && (
                  <GridEmptyRow
                    colSpan={5}
                    message={
                      query.trim()
                        ? "Nenhum usuário corresponde à busca."
                        : "Nenhum superadmin cadastrado."
                    }
                  />
                )}
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "muted"}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(u.lastLoginAt)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar superadmin</DialogTitle>
            <DialogDescription>
              Altere nome, e-mail ou status. A senha só pode ser trocada pelo próprio usuário em Meu perfil.
            </DialogDescription>
          </DialogHeader>
          {editForm && editUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-platform-name">Nome</Label>
                <Input
                  id="edit-platform-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => f && { ...f, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-platform-email">E-mail</Label>
                <Input
                  id="edit-platform-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => f && { ...f, email: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Conta ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Usuários inativos não conseguem fazer login
                  </p>
                </div>
                <Switch
                  checked={editForm.isActive}
                  onCheckedChange={(checked) =>
                    setEditForm((f) => f && { ...f, isActive: checked })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                editUser &&
                editForm &&
                updateMutation.mutate({
                  id: editUser.id,
                  name: editForm.name.trim(),
                  email: editForm.email.trim(),
                  isActive: editForm.isActive,
                })
              }
              disabled={!canSaveEdit || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
