import { useMemo, useState } from "react";
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

const VALUE_TYPES = ["Boolean", "Limit"] as const;

export function AdminFeaturesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<{
    id: string;
    name: string;
    category: string;
    isActive: boolean;
  } | null>(null);
  const [form, setForm] = useState({
    key: "",
    name: "",
    category: "reports",
    valueType: "Boolean",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-features"],
    queryFn: () => api.adminListFeatures(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.adminCreateFeature(token!, form.key, form.name, form.category, form.valueType),
    onSuccess: () => {
      toast.success("Feature criada");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-features"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.adminUpdateFeature(token!, editingFeature!.id, {
        name: editingFeature!.name,
        category: editingFeature!.category,
        isActive: editingFeature!.isActive,
      }),
    onSuccess: () => {
      toast.success("Feature atualizada");
      setEditOpen(false);
      setEditingFeature(null);
      queryClient.invalidateQueries({ queryKey: ["admin-features"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const filteredFeatures = useMemo(() => {
    const all = data ?? [];
    return all.filter((f) =>
      matchesGridSearch(
        query,
        f.name,
        f.key,
        f.category,
        f.valueType,
        f.isActive ? "ativa" : "inativa",
      ),
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Features" description="Capabilities configuráveis por plano" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Nova feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar feature</DialogTitle>
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
                <Label>Categoria</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.valueType}
                  onValueChange={(v) => setForm((f) => ({ ...f, valueType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <CardTitle>Catálogo global</CardTitle>
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome, key ou categoria"
            resultCount={filteredFeatures.length}
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.length === 0 && (
                  <GridEmptyRow
                    colSpan={6}
                    message={
                      query.trim()
                        ? "Nenhuma feature corresponde à busca."
                        : "Nenhuma feature cadastrada."
                    }
                  />
                )}
                {filteredFeatures.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.name}</TableCell>
                    <TableCell className="font-mono text-xs">{f.key}</TableCell>
                    <TableCell>{f.category}</TableCell>
                    <TableCell>{f.valueType}</TableCell>
                    <TableCell>
                      <Badge variant={f.isActive ? "success" : "muted"}>
                        {f.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingFeature({
                            id: f.id,
                            name: f.name,
                            category: f.category,
                            isActive: f.isActive,
                          });
                          setEditOpen(true);
                        }}
                      >
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar feature</DialogTitle>
          </DialogHeader>
          {editingFeature && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingFeature.name}
                  onChange={(e) =>
                    setEditingFeature((f) => f && { ...f, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={editingFeature.category}
                  onChange={(e) =>
                    setEditingFeature((f) => f && { ...f, category: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="feature-active"
                  type="checkbox"
                  checked={editingFeature.isActive}
                  onChange={(e) =>
                    setEditingFeature((f) => f && { ...f, isActive: e.target.checked })
                  }
                />
                <Label htmlFor="feature-active">Feature ativa</Label>
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
