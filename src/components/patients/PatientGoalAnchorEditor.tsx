import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PatientBehavioralProfile } from "@/types/api";

type Props = {
  token: string;
  patientId: string;
  canWrite: boolean;
  profile: PatientBehavioralProfile | undefined;
};

export function PatientGoalAnchorEditor({ token, patientId, canWrite, profile }: Props) {
  const queryClient = useQueryClient();
  const [anchorHabit, setAnchorHabit] = useState(profile?.anchorHabit ?? "");
  const [whenWhere, setWhenWhere] = useState(profile?.whenWhereText ?? "");
  const [targetDoses, setTargetDoses] = useState(
    profile?.targetDosesPerWeek != null ? String(profile.targetDosesPerWeek) : "",
  );

  const saveAnchor = useMutation({
    mutationFn: () =>
      api.updatePatientAnchorHabit(token, patientId, anchorHabit.trim() || null),
    onSuccess: () => {
      toast.success("Hábito âncora atualizado");
      void queryClient.invalidateQueries({ queryKey: ["patient-behavioral-profile", patientId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar âncora"),
  });

  const saveGoal = useMutation({
    mutationFn: () =>
      api.updatePatientBehaviourGoal(token, patientId, {
        anchorHabit: anchorHabit.trim() || null,
        whenWhereText: whenWhere.trim() || null,
        targetDosesPerWeek: targetDoses ? Number(targetDoses) : undefined,
        active: true,
      }),
    onSuccess: () => {
      toast.success("Meta comportamental atualizada");
      void queryClient.invalidateQueries({ queryKey: ["patient-behavioral-profile", patientId] });
      void queryClient.invalidateQueries({ queryKey: ["patient-behaviour-goal", patientId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar meta"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meta e hábito âncora</CardTitle>
        <CardDescription>
          Goal-setting + implementation intention (Patton / TPB volitional). Sync com review semanal no
          WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(profile?.targetDosesPerWeek != null || profile?.goalLastReviewedAt) && (
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            {profile.targetDosesPerWeek != null && (
              <p>Meta atual: {profile.targetDosesPerWeek} doses/semana</p>
            )}
            {profile.goalLastReviewedAt && (
              <p>Última review: {formatDateTime(profile.goalLastReviewedAt)}</p>
            )}
            {profile.whenWhereText && <p className="sm:col-span-2">When/where: {profile.whenWhereText}</p>}
          </div>
        )}

        {!canWrite ? (
          <p className="text-sm text-muted-foreground">Somente leitura.</p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="anchor-habit">Hábito âncora</Label>
              <Input
                id="anchor-habit"
                value={anchorHabit}
                onChange={(e) => setAnchorHabit(e.target.value)}
                placeholder="Ex.: depois do café da manhã"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="when-where">Quando e onde</Label>
              <Textarea
                id="when-where"
                value={whenWhere}
                onChange={(e) => setWhenWhere(e.target.value)}
                placeholder='Ex.: "Depois do café, na cozinha"'
                rows={2}
              />
            </div>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="target-doses">Meta doses/semana</Label>
              <Input
                id="target-doses"
                type="number"
                min={1}
                max={70}
                value={targetDoses}
                onChange={(e) => setTargetDoses(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saveAnchor.isPending}
                onClick={() => saveAnchor.mutate()}
              >
                Salvar âncora
              </Button>
              <Button size="sm" disabled={saveGoal.isPending} onClick={() => saveGoal.mutate()}>
                Salvar meta
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
