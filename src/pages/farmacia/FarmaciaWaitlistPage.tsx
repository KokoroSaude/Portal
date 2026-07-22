import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PickupFeatureLocked } from "@/components/farmacia/PickupFeatureLocked";
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
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function FarmaciaWaitlistPage() {
  const { token, canWrite } = useAuth();
  const queryClient = useQueryClient();
  const [medicationFilter, setMedicationFilter] = useState<string>("all");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollPatientId, setEnrollPatientId] = useState("");
  const [enrollMedicationId, setEnrollMedicationId] = useState("");
  const { pickupAccess: pickupEnabled, settings } = useTenantSettings();

  const medications = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token && pickupEnabled,
  });

  const waitlist = useQuery({
    queryKey: ["pickup-waitlist", medicationFilter],
    queryFn: () =>
      api.listMedicationWaitlist(
        token!,
        medicationFilter === "all" ? undefined : medicationFilter,
      ),
    enabled: !!token && pickupEnabled,
  });

  const patients = useQuery({
    queryKey: ["patients-waitlist-lookup"],
    queryFn: () => api.getPatients(token!, { page: 1, pageSize: 200 }),
    enabled: !!token && pickupEnabled,
  });

  const patientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients.data?.items ?? []) {
      map.set(p.id, p.name ?? p.phone);
    }
    return map;
  }, [patients.data]);

  const medNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of medications.data ?? []) {
      map.set(m.id, m.canonicalName);
    }
    return map;
  }, [medications.data]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof waitlist.data>();
    for (const entry of waitlist.data ?? []) {
      const list = groups.get(entry.medicationId) ?? [];
      list.push(entry);
      groups.set(entry.medicationId, list);
    }
    return groups;
  }, [waitlist.data]);

  const removeMutation = useMutation({
    mutationFn: (entryId: string) => api.removeMedicationWaitlist(token!, entryId),
    onSuccess: () => {
      toast.success("Removido da fila");
      queryClient.invalidateQueries({ queryKey: ["pickup-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["pickup-dashboard"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover"),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.enrollMedicationWaitlist(token!, enrollPatientId, enrollMedicationId),
    onSuccess: () => {
      toast.success("Paciente inscrito na fila");
      setEnrollOpen(false);
      setEnrollPatientId("");
      setEnrollMedicationId("");
      queryClient.invalidateQueries({ queryKey: ["pickup-waitlist"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao inscrever"),
  });

  if (!pickupEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fila crônica" description="Medicamentos em falta prolongada" />
        <PickupFeatureLocked />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fila crônica"
        description="Pacientes aguardando medicamentos sem estoque disponível"
        actions={
          canWrite && (
            <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Inscrever paciente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inscrever na fila crônica</DialogTitle>
                  <DialogDescription>
                    Use quando o medicamento está em falta e o paciente precisa aguardar reposição.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente</Label>
                    <Select value={enrollPatientId} onValueChange={setEnrollPatientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(patients.data?.items ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name ?? p.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Medicamento</Label>
                    <Select value={enrollMedicationId} onValueChange={setEnrollMedicationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(medications.data ?? []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.canonicalName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => enrollMutation.mutate()}
                    disabled={
                      enrollMutation.isPending || !enrollPatientId || !enrollMedicationId
                    }
                  >
                    Inscrever
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="flex items-end gap-4">
        <div className="w-64 space-y-2">
          <Label>Filtrar medicamento</Label>
          <Select value={medicationFilter} onValueChange={setMedicationFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(medications.data ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.canonicalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {waitlist.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (waitlist.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum paciente na fila crônica.
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([medicationId, entries]) => {
          const medName = medNameById.get(medicationId) ?? medicationId;
          const isCritical =
            (entries?.length ?? 0) >= (settings?.pickupCriticalWaitlistThreshold ?? 20);

          return (
            <Card key={medicationId}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-lg">{medName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={isCritical ? "warning" : "secondary"}>
                    {entries?.length ?? 0} paciente(s)
                  </Badge>
                  {isCritical && <Badge variant="outline">Crítico</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Inscrito em</TableHead>
                      {canWrite && <TableHead className="w-16" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(entries ?? []).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            to={`/pacientes/${entry.patientId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {patientNameById.get(entry.patientId) ?? entry.patientId.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell>{entry.priorityScore}</TableCell>
                        <TableCell>{formatDateTime(entry.enrolledAt)}</TableCell>
                        {canWrite && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Remover da fila"
                              onClick={() => removeMutation.mutate(entry.id)}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
