import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiClientError } from "@/lib/api";
import { behavioralDimensionLabel, normalizeBehavioralDimension } from "@/lib/behavioral-dimensions";
import { cn, formatDateTime } from "@/lib/utils";
import type { StrategicAssessmentQuestion } from "@/types/api";

const DIMENSION_ORDER = [
  "Lifestyle",
  "Habits",
  "Emotions",
  "CognitiveBias",
  "Comorbidity",
];

type StrategicAssessmentFormProps = {
  token: string;
  patientId: string;
  canWrite: boolean;
};

export function StrategicAssessmentForm({
  token,
  patientId,
  canWrite,
}: StrategicAssessmentFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  const { data: scaleData, isLoading: scaleLoading } = useQuery({
    queryKey: ["strategic-assessment-scale"],
    queryFn: () => api.getStrategicAssessmentScale(token),
  });

  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ["patient-strategic-assessment", patientId],
    queryFn: () => api.getPatientStrategicAssessment(token, patientId),
  });

  const scale = scaleData?.scale;
  const minScore = scale?.minScore ?? 1;
  const maxScore = scale?.maxScore ?? 5;

  const groups = useMemo(() => {
    if (!scale?.questions) return [];
    const enabled = scale.questions.filter((q) => q.enabled).sort((a, b) => a.order - b.order);
    const byDim = new Map<string, StrategicAssessmentQuestion[]>();
    for (const q of enabled) {
      const dim = normalizeBehavioralDimension(q.dimension);
      const list = byDim.get(dim) ?? [];
      list.push({ ...q, dimension: dim });
      byDim.set(dim, list);
    }
    const ordered: { dimension: string; questions: StrategicAssessmentQuestion[] }[] = [];
    for (const dim of DIMENSION_ORDER) {
      const qs = byDim.get(dim);
      if (qs?.length) ordered.push({ dimension: dim, questions: qs });
    }
    for (const [dim, qs] of byDim) {
      if (!DIMENSION_ORDER.includes(dim)) ordered.push({ dimension: dim, questions: qs });
    }
    return ordered;
  }, [scale]);

  useEffect(() => {
    if (latest?.answers?.length) {
      const initial: Record<string, number> = {};
      for (const a of latest.answers) initial[a.questionId] = a.score;
      setScores(initial);
    }
  }, [latest]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const answers = Object.entries(scores).map(([questionId, score]) => ({
        questionId,
        score,
      }));
      return api.submitStrategicAssessment(token, patientId, answers);
    },
    onSuccess: (data) => {
      if (data.operatorSummary) {
        toast.success(data.operatorSummary, { duration: 8000 });
      } else {
        toast.success("Avaliação estratégica salva. Perfil comportamental atualizado.");
      }
      queryClient.invalidateQueries({ queryKey: ["patient-strategic-assessment", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-behavioral-profile", patientId] });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiClientError ? err.message : "Não foi possível salvar a avaliação.";
      toast.error(msg);
    },
  });

  const currentGroup = groups[step];
  const allAnswered =
    scale?.questions
      .filter((q) => q.enabled)
      .every((q) => scores[q.id] >= minScore && scores[q.id] <= maxScore) ?? false;

  const stepComplete =
    currentGroup?.questions.every(
      (q) => scores[q.id] >= minScore && scores[q.id] <= maxScore,
    ) ?? false;

  if (scaleLoading || latestLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!scale || groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Avaliação estratégica indisponível para este tenant.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Avaliação estratégica</CardTitle>
        <CardDescription>
          {scale.introText}
          {latest && (
            <span className="mt-2 block text-xs">
              Última resposta: {formatDateTime(latest.completedAt)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {groups.map((g, i) => (
            <Badge
              key={g.dimension}
              variant={i === step ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => canWrite && setStep(i)}
            >
              {behavioralDimensionLabel(g.dimension)}
            </Badge>
          ))}
        </div>

        {currentGroup && (
          <div className="space-y-5">
            <h3 className="font-medium">{behavioralDimensionLabel(currentGroup.dimension)}</h3>
            {currentGroup.questions.map((q) => (
              <div key={q.id} className="space-y-2 rounded-lg border p-4">
                <Label className="text-sm leading-snug">{q.text}</Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: maxScore - minScore + 1 }, (_, i) => minScore + i).map(
                    (n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant={scores[q.id] === n ? "default" : "outline"}
                        disabled={!canWrite}
                        className={cn("min-w-9", scores[q.id] === n && "ring-2 ring-primary/30")}
                        onClick={() =>
                          setScores((prev) => ({ ...prev, [q.id]: n }))
                        }
                      >
                        {n}
                      </Button>
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {minScore} = discordo totalmente · {maxScore} = concordo totalmente
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="mr-1 size-4" />
            Anterior
          </Button>

          {step < groups.length - 1 ? (
            <Button
              type="button"
              size="sm"
              disabled={!stepComplete}
              onClick={() => setStep((s) => s + 1)}
            >
              Próximo
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            canWrite && (
              <Button
                type="button"
                size="sm"
                disabled={!allAnswered || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                <Save className="mr-1 size-4" />
                {submitMutation.isPending ? "Salvando…" : "Salvar avaliação"}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
