import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { api, ApiClientError } from "@/lib/api";
import { DELEGATE_RELATIONSHIP_LABELS } from "@/lib/constants";
import { maskCpf, stripCpf } from "@/lib/cpf";
import type { PatientCareDelegate, UpsertPatientCareDelegatePayload } from "@/types/api";

const EMPTY_DELEGATE: UpsertPatientCareDelegatePayload = {
  name: "",
  phone: "",
  cpf: "",
  relationship: "Outro",
  canPickup: false,
  receivesPickupNotifications: false,
  receivesAdherenceMessages: false,
  canReportCheckin: true,
  householdLabel: "",
  isActive: true,
};

interface PatientCareDelegatesSectionProps {
  patientId: string;
  token: string;
  canWrite: boolean;
}

export function PatientCareDelegatesSection({
  patientId,
  token,
  canWrite,
}: PatientCareDelegatesSectionProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PatientCareDelegate | null>(null);
  const [form, setForm] = useState<UpsertPatientCareDelegatePayload>(EMPTY_DELEGATE);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-delegates", patientId],
    queryFn: () => api.listPatientCareDelegates(token, patientId),
    enabled: !!token && !!patientId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["patient-delegates", patientId] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: UpsertPatientCareDelegatePayload = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        cpf: stripCpf(form.cpf ?? "") || undefined,
        householdLabel: form.householdLabel?.trim() || undefined,
      };
      return editing
        ? api.updatePatientCareDelegate(token, patientId, editing.id, payload)
        : api.createPatientCareDelegate(token, patientId, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Contato atualizado" : "Contato adicionado");
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_DELEGATE);
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar contato"),
  });

  const deleteMutation = useMutation({
    mutationFn: (delegateId: string) =>
      api.deletePatientCareDelegate(token, patientId, delegateId),
    onSuccess: () => {
      toast.success("Contato removido");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover contato"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_DELEGATE);
    setDialogOpen(true);
  }

  function openEdit(delegate: PatientCareDelegate) {
    setEditing(delegate);
    setForm({
      name: delegate.name,
      phone: delegate.phone,
      cpf: delegate.cpf ?? "",
      relationship: delegate.relationship,
      canPickup: delegate.canPickup,
      receivesPickupNotifications: delegate.receivesPickupNotifications,
      receivesAdherenceMessages: delegate.receivesAdherenceMessages,
      canReportCheckin: delegate.canReportCheckin,
      householdLabel: delegate.householdLabel ?? "",
      isActive: delegate.isActive,
    });
    setDialogOpen(true);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Rede de cuidado</CardTitle>
          <CardDescription>
            Familiares e cuidadores que podem retirar medicamentos ou receber avisos.
          </CardDescription>
        </div>
        {canWrite && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Relação</TableHead>
                <TableHead>Permissões</TableHead>
                {canWrite && <TableHead className="w-24" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((delegate) => (
                <TableRow key={delegate.id} className={!delegate.isActive ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{delegate.name}</TableCell>
                  <TableCell>{delegate.phone}</TableCell>
                  <TableCell>
                    {DELEGATE_RELATIONSHIP_LABELS[delegate.relationship] ?? delegate.relationship}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {delegate.canPickup && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                          Retirada
                        </span>
                      )}
                      {delegate.receivesPickupNotifications && (
                        <span className="rounded bg-muted px-1.5 py-0.5">Avisos retirada</span>
                      )}
                      {delegate.receivesAdherenceMessages && (
                        <span className="rounded bg-muted px-1.5 py-0.5">Adesão</span>
                      )}
                      {delegate.canReportCheckin && (
                        <span className="rounded bg-muted px-1.5 py-0.5">Check-in</span>
                      )}
                    </div>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(delegate)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(delegate.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar contato" : "Novo contato"}</DialogTitle>
            <DialogDescription>Configure quem pode retirar e receber comunicações.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  placeholder="+5511999999999"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF (opcional)</Label>
                <Input
                  value={form.cpf ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Relação</Label>
                <Select
                  value={form.relationship ?? "Outro"}
                  onValueChange={(v) => setForm((f) => ({ ...f, relationship: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DELEGATE_RELATIONSHIP_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grupo familiar (opcional)</Label>
                <Input
                  value={form.householdLabel ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, householdLabel: e.target.value }))}
                  placeholder="Ex.: Casa da mãe"
                />
              </div>
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="canPickup"
                  checked={form.canPickup}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, canPickup: c === true }))}
                />
                <Label htmlFor="canPickup">Pode retirar medicamentos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="receivesPickupNotifications"
                  checked={form.receivesPickupNotifications}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, receivesPickupNotifications: c === true }))
                  }
                />
                <Label htmlFor="receivesPickupNotifications">Recebe avisos de retirada</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="receivesAdherenceMessages"
                  checked={form.receivesAdherenceMessages}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, receivesAdherenceMessages: c === true }))
                  }
                />
                <Label htmlFor="receivesAdherenceMessages">Recebe mensagens de adesão</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="canReportCheckin"
                  checked={form.canReportCheckin}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, canReportCheckin: c === true }))}
                />
                <Label htmlFor="canReportCheckin">Pode informar check-in</Label>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="delegateActive">Ativo</Label>
                <Switch
                  id="delegateActive"
                  checked={form.isActive ?? true}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name.trim() || !form.phone.trim()}
            >
              {saveMutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
