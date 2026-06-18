import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { AdherenceTrendChart } from "@/components/reports/ReportCharts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function MedicationProgramsPage() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: "",
    medicationId: "",
    atRiskMissedThreshold: "3",
    targetAdherenceRate: "",
  });
  const range = defaultRange();

  const programs = useQuery({
    queryKey: ["medication-programs"],
    queryFn: () => api.listMedicationPrograms(token!),
    enabled: !!token,
  });

  const medications = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token && createOpen,
  });

  const dashboard = useQuery({
    queryKey: ["medication-program-dashboard", selectedId],
    queryFn: () => api.getMedicationProgramDashboard(token!, selectedId!, range.from, range.to),
    enabled: !!token && !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createMedicationProgram(token!, {
        name: newProgram.name.trim(),
        medicationId: newProgram.medicationId,
        atRiskMissedThreshold: Number(newProgram.atRiskMissedThreshold) || 3,
        targetAdherenceRate: newProgram.targetAdherenceRate
          ? Number(newProgram.targetAdherenceRate) / 100
          : undefined,
      }),
    onSuccess: (result) => {
      toast.success("Programa criado");
      setCreateOpen(false);
      setSelectedId(result.id);
      void queryClient.invalidateQueries({ queryKey: ["medication-programs"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar programa"),
  });

  const selected = programs.data?.find((p) => p.id === selectedId) ?? programs.data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programas terapêuticos"
        description="Programas nomeados por medicamento com metas e ações"
        actions={
          isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo programa
            </Button>
          ) : undefined
        }
      />

      {programs.isLoading && <Skeleton className="h-24 w-full" />}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Programas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(programs.data ?? []).map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => setSelectedId(program.id)}
                className={`flex w-full flex-col rounded-md border p-3 text-left ${
                  (selected?.id ?? "") === program.id ? "border-primary bg-muted/50" : ""
                }`}
              >
                <span className="font-medium">{program.name}</span>
                <span className="text-sm text-muted-foreground">{program.medicationName}</span>
                {!program.isActive && <Badge variant="outline">Inativo</Badge>}
              </button>
            ))}
            {programs.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum programa cadastrado.</p>
            )}
          </CardContent>
        </Card>

        {selected && dashboard.data && (
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.medicationName}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/relatorios/programa-medicamento?medicationId=${selected.medicationId}`}>
                    Relatório completo
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/whatsapp/promocoes?segment=PatientsOnMedication&medicationId=${selected.medicationId}`,
                    )
                  }
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Disparar campanha
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pacientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-serif text-3xl">{dashboard.data.activePatients}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Adesão</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-serif text-3xl">{formatPercent(dashboard.data.adherenceRate)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Em risco</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-serif text-3xl">{dashboard.data.atRiskPatients.length}</p>
                </CardContent>
              </Card>
            </div>

            <AdherenceTrendChart data={dashboard.data.trend} />
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo programa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newProgram.name}
                onChange={(e) => setNewProgram((p) => ({ ...p, name: e.target.value }))}
                placeholder="Programa Semaglutida 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Medicamento (catálogo)</Label>
              <Select
                value={newProgram.medicationId}
                onValueChange={(v) => setNewProgram((p) => ({ ...p, medicationId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Threshold de risco (misses)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newProgram.atRiskMissedThreshold}
                  onChange={(e) =>
                    setNewProgram((p) => ({ ...p, atRiskMissedThreshold: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de adesão (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newProgram.targetAdherenceRate}
                  onChange={(e) =>
                    setNewProgram((p) => ({ ...p, targetAdherenceRate: e.target.value }))
                  }
                  placeholder="80"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending || !newProgram.name.trim() || !newProgram.medicationId
              }
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
