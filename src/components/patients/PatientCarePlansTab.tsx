import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api";
import type { CarePlan, CarePlanUpsert } from "@/types/api";

const EMPTY_PLAN: CarePlanUpsert = {
  medication: "",
  dosage: "1 comprimido",
  scheduledTimes: "08:00",
  instructions: "",
};

interface EditableCarePlan extends CarePlanUpsert {
  id?: string;
}

interface PatientCarePlansTabProps {
  patientId: string;
  token: string;
  canWrite: boolean;
}

export function PatientCarePlansTab({ patientId, token, canWrite }: PatientCarePlansTabProps) {
  const queryClient = useQueryClient();
  const [plans, setPlans] = useState<EditableCarePlan[]>([]);
  const [newPlan, setNewPlan] = useState<CarePlanUpsert>(EMPTY_PLAN);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-care-plans", patientId],
    queryFn: () => api.listCarePlans(token, patientId),
    enabled: !!token && !!patientId,
  });

  useEffect(() => {
    if (!data) return;
    setPlans(
      data.map((p: CarePlan) => ({
        id: p.id,
        medication: p.medication,
        dosage: p.dosage,
        scheduledTimes: p.scheduledTimes,
        instructions: p.instructions ?? "",
      })),
    );
  }, [data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["patient-care-plans", patientId] });
    queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
    queryClient.invalidateQueries({ queryKey: ["patients"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (plan: EditableCarePlan) => {
      const payload: CarePlanUpsert = {
        medication: plan.medication.trim(),
        dosage: plan.dosage.trim(),
        scheduledTimes: plan.scheduledTimes.trim(),
        instructions: plan.instructions?.trim() || undefined,
      };
      if (plan.id) {
        return api.updateCarePlanById(token, patientId, plan.id, payload);
      }
      return api.createCarePlan(token, patientId, payload);
    },
    onSuccess: () => {
      toast.success("Medicamento salvo");
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar medicamento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (carePlanId: string) => api.deleteCarePlan(token, patientId, carePlanId),
    onSuccess: () => {
      toast.success("Medicamento removido");
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover medicamento");
    },
  });

  const addMutation = useMutation({
    mutationFn: () =>
      api.createCarePlan(token, patientId, {
        medication: newPlan.medication.trim(),
        dosage: newPlan.dosage.trim(),
        scheduledTimes: newPlan.scheduledTimes.trim(),
        instructions: newPlan.instructions?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Medicamento adicionado");
      setNewPlan(EMPTY_PLAN);
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao adicionar medicamento");
    },
  });

  const updatePlan = (index: number, patch: Partial<EditableCarePlan>) => {
    setPlans((current) => current.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const isValid = (plan: CarePlanUpsert) =>
    plan.medication.trim().length > 0 && plan.scheduledTimes.trim().length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plano de cuidado</CardTitle>
          <CardDescription>
            Cada medicamento tem horários próprios de lembrete. Você pode cadastrar quantos precisar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum medicamento cadastrado ainda.</p>
          )}

          {plans.map((plan, index) => (
            <div key={plan.id ?? index} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Medicamento {index + 1}</p>
                {canWrite && plan.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(plan.id!)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Medicamento</Label>
                  <Input
                    value={plan.medication}
                    onChange={(e) => updatePlan(index, { medication: e.target.value })}
                    disabled={!canWrite}
                    placeholder="Ex: Puram T4, Paroxetina"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosagem</Label>
                  <Input
                    value={plan.dosage}
                    onChange={(e) => updatePlan(index, { dosage: e.target.value })}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Horários (HH:mm separados por vírgula)</Label>
                  <Input
                    placeholder="08:00,20:00"
                    value={plan.scheduledTimes}
                    onChange={(e) => updatePlan(index, { scheduledTimes: e.target.value })}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Instruções</Label>
                  <Textarea
                    value={plan.instructions ?? ""}
                    onChange={(e) => updatePlan(index, { instructions: e.target.value })}
                    disabled={!canWrite}
                  />
                </div>
              </div>
              {canWrite && (
                <Button
                  type="button"
                  onClick={() => saveMutation.mutate(plan)}
                  disabled={saveMutation.isPending || !isValid(plan)}
                >
                  <Save className="size-4" />
                  Salvar medicamento
                </Button>
              )}
            </div>
          ))}

          {!canWrite && (
            <p className="text-sm text-muted-foreground">
              Seu perfil é somente leitura e não pode editar o plano de cuidado.
            </p>
          )}
        </CardContent>
      </Card>

      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar medicamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Medicamento</Label>
                <Input
                  value={newPlan.medication}
                  onChange={(e) => setNewPlan((p) => ({ ...p, medication: e.target.value }))}
                  placeholder="Ex: Puram T4"
                />
              </div>
              <div className="space-y-2">
                <Label>Dosagem</Label>
                <Input
                  value={newPlan.dosage}
                  onChange={(e) => setNewPlan((p) => ({ ...p, dosage: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Horários</Label>
                <Input
                  placeholder="22:00"
                  value={newPlan.scheduledTimes}
                  onChange={(e) => setNewPlan((p) => ({ ...p, scheduledTimes: e.target.value }))}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !isValid(newPlan)}
            >
              <Plus className="size-4" />
              Adicionar medicamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
