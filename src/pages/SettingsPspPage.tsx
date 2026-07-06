import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

type FormState = {
  name: string;
  medication: string;
  brandDisplayName: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  medication: "",
  brandDisplayName: "",
  isActive: true,
});

export function SettingsPspPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const programs = useQuery({
    queryKey: ["psp-programs"],
    queryFn: () => api.listPspPrograms(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.pspPrograms),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        medication: form.medication.trim() || undefined,
        brandDisplayName: form.brandDisplayName.trim() || undefined,
      };
      if (editingId) {
        await api.updatePspProgram(token!, editingId, { ...payload, isActive: form.isActive });
      } else {
        await api.createPspProgram(token!, payload);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Programa atualizado" : "Programa criado");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      void queryClient.invalidateQueries({ queryKey: ["psp-programs"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar programa"),
  });

  if (!hasFeature(FEATURE_KEYS.pspPrograms)) {
    return (
      <FeatureLocked
        title="Programas de suporte (PSP)"
        description="Este módulo não está incluído no seu plano atual."
      />
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(program: {
    id: string;
    name: string;
    medication: string | null;
    brandDisplayName: string | null;
    isActive: boolean;
  }) {
    setEditingId(program.id);
    setForm({
      name: program.name,
      medication: program.medication ?? "",
      brandDisplayName: program.brandDisplayName ?? "",
      isActive: program.isActive,
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programas de suporte (PSP)"
        description="Cadastro de programas de suporte ao paciente por medicamento ou marca — base para jornadas farmacêuticas."
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo programa
            </Button>
          ) : undefined
        }
      />

      {programs.isLoading && <Skeleton className="h-48 w-full" />}

      {programs.data && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Programas cadastrados</CardTitle>
            <CardDescription>
              {programs.data.length} programa(s) ativos ou inativos nesta organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programs.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum programa PSP cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="w-[100px]" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.medication ?? "—"}</TableCell>
                      <TableCell>{p.brandDisplayName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar programa PSP" : "Novo programa PSP"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="psp-name">Nome</Label>
              <Input
                id="psp-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Programa Diabetes 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="psp-med">Medicamento</Label>
              <Input
                id="psp-med"
                value={form.medication}
                onChange={(e) => setForm((f) => ({ ...f, medication: e.target.value }))}
                placeholder="Opcional — princípio ativo ou SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="psp-brand">Nome comercial</Label>
              <Input
                id="psp-brand"
                value={form.brandDisplayName}
                onChange={(e) => setForm((f) => ({ ...f, brandDisplayName: e.target.value }))}
                placeholder="Opcional — marca exibida ao paciente"
              />
            </div>
            {editingId && (
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="psp-active">Programa ativo</Label>
                <Switch
                  id="psp-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
