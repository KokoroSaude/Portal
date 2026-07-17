import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { formatDateTime } from "@/lib/utils";
import type { UpsertPatientCaregiverPayload } from "@/types/api";

const EMPTY: UpsertPatientCaregiverPayload = {
  name: "",
  phone: "",
  relationship: "Cuidador",
  notifyOnMiss: true,
  notifyOnHighRiskAbandonment: true,
};

type Props = {
  patientId: string;
  token: string;
  canWrite: boolean;
};

export function PatientCaregiversSection({ patientId, token, canWrite }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UpsertPatientCaregiverPayload>(EMPTY);

  const caregivers = useQuery({
    queryKey: ["patient-caregivers", patientId],
    queryFn: () => api.listPatientCaregivers(token, patientId),
  });

  const upsert = useMutation({
    mutationFn: () => api.upsertPatientCaregiver(token, patientId, form),
    onSuccess: () => {
      toast.success("Cuidador salvo");
      setOpen(false);
      setForm(EMPTY);
      void queryClient.invalidateQueries({ queryKey: ["patient-caregivers", patientId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar cuidador"),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.revokePatientCaregiver(token, patientId, id),
    onSuccess: () => {
      toast.success("Consentimento revogado");
      void queryClient.invalidateQueries({ queryKey: ["patient-caregivers", patientId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao revogar"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Cuidadores (adesão)</CardTitle>
          <CardDescription>
            Opt-in do paciente + alertas após misses ou risco alto. Sem check-in pelo cuidador no MVP.
          </CardDescription>
        </div>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="mr-1 size-3.5" />
            Adicionar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {caregivers.isLoading && <Skeleton className="h-24 w-full" />}
        {!caregivers.isLoading && (caregivers.data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum cuidador consentido.</p>
        )}
        {(caregivers.data?.length ?? 0) > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Relação</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Consentimento</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {caregivers.data?.map((c) => (
                <TableRow key={c.id} className={!c.isActive || c.revokedAt ? "opacity-50" : undefined}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>
                    {DELEGATE_RELATIONSHIP_LABELS[c.relationship] ?? c.relationship}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.phoneLast4 ? `•••• ${c.phoneLast4}` : c.phone}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(c.consentCapturedAt)}
                    {c.revokedAt && " · revogado"}
                  </TableCell>
                  <TableCell>
                    {canWrite && c.isActive && !c.revokedAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revoke.mutate(c.id)}
                        disabled={revoke.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cuidador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone (E.164)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label>Relação</Label>
              <Select
                value={form.relationship}
                onValueChange={(v) => setForm((f) => ({ ...f, relationship: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELEGATE_RELATIONSHIP_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.notifyOnMiss ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, notifyOnMiss: Boolean(v) }))}
              />
              Avisar em misses consecutivos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.notifyOnHighRiskAbandonment ?? true}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, notifyOnHighRiskAbandonment: Boolean(v) }))
                }
              />
              Avisar em risco alto de abandono
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!form.name.trim() || !form.phone.trim() || upsert.isPending}
              onClick={() => upsert.mutate()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
