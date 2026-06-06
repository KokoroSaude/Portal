import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { matchesGridSearch } from "@/lib/gridSearch";

export function AdminPlansPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string; sortOrder: number; isActive: boolean } | null>(null);
  const [form, setForm] = useState({ key: "", name: "", sortOrder: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.adminListPlans(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () => api.adminCreatePlan(token!, form.key, form.name, form.sortOrder),
    onSuccess: () => {
      toast.success("Plano criado");
      setOpen(false);
      setForm({ key: "", name: "", sortOrder: 10 });
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.adminUpdatePlan(
        token!,
        editingPlan!.id,
        editingPlan!.name,
        editingPlan!.sortOrder,
        editingPlan!.isActive,
      ),
    onSuccess: () => {
      toast.success("Plano atualizado");
      setEditOpen(false);
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const filteredPlans = useMemo(() => {
    const all = data ?? [];
    return all.filter((p) =>
      matchesGridSearch(
        query,
        p.name,
        p.key,
        p.tenantCount,
        p.isActive ? "ativo" : "inativo",
      ),
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Planos" description="Planos de assinatura e limites por feature" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Novo plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Key</Label>
                <Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Catálogo</CardTitle>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome ou key"
            resultCount={filteredPlans.length}
            totalCount={data?.length}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Tenants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 && (
                  <GridEmptyRow
                    colSpan={5}
                    message={
                      query.trim() ? "Nenhum plano corresponde à busca." : "Nenhum plano cadastrado."
                    }
                  />
                )}
                {filteredPlans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.key}</TableCell>
                    <TableCell>{p.tenantCount}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "success" : "muted"}>
                        {p.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan({
                              id: p.id,
                              name: p.name,
                              sortOrder: p.sortOrder,
                              isActive: p.isActive,
                            });
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/admin/planos/${p.id}`}>Features</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan((p) => p && { ...p, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={editingPlan.sortOrder}
                  onChange={(e) =>
                    setEditingPlan((p) => p && { ...p, sortOrder: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="plan-active"
                  type="checkbox"
                  checked={editingPlan.isActive}
                  onChange={(e) =>
                    setEditingPlan((p) => p && { ...p, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="plan-active">Plano ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
