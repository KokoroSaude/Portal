import { useState } from "react";
import { ChevronDown, ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TPB_CONSTRUCT_LABELS, TPB_RISK_LABELS, TPB_TRIGGER_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { PatientTpbRisk, TpbAssessmentDetail } from "@/types/api";

function IntentionDelta({ delta }: { delta: number | null | undefined }) {
  if (delta == null || delta === 0) return null;
  const improved = delta > 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        improved
          ? "border-emerald-300 text-emerald-800 dark:text-emerald-200"
          : "border-amber-300 text-amber-800 dark:text-amber-200",
      )}
    >
      {improved ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {improved ? "+" : ""}
      {delta.toFixed(1)} intenção vs anterior
    </Badge>
  );
}

function ConstructBars({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{TPB_CONSTRUCT_LABELS[key] ?? key}</span>
            <span>{value.toFixed(1)}/5</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (value / 5) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentCard({ assessment, index }: { assessment: TpbAssessmentDetail; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{formatDateTime(assessment.completedAt)}</span>
            <Badge variant="secondary">
              {TPB_TRIGGER_LABELS[assessment.trigger] ?? assessment.trigger}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Intenção: {assessment.intentionScore.toFixed(1)}/5
            </span>
            <IntentionDelta delta={assessment.intentionDeltaFromPrevious} />
          </div>
          <ConstructBars scores={assessment.constructScores} />
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-2">
          <ol className="space-y-2">
            {assessment.answers.map((q) => (
              <li key={q.questionId} className="flex gap-3 rounded-lg px-3 py-2 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {q.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p>{q.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {TPB_CONSTRUCT_LABELS[q.construct] ?? q.construct}:{" "}
                    <strong>{q.scoreLabel}</strong>
                    {q.changedFromPrevious != null && q.previousScore != null && (
                      <span className="text-amber-700 dark:text-amber-300">
                        {" "}
                        (antes: {q.previousScore})
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

type PatientTpbTabProps = {
  assessments: TpbAssessmentDetail[] | undefined;
  risk: PatientTpbRisk | undefined;
  isLoading: boolean;
  riskLoading?: boolean;
  canTrigger?: boolean;
  tpbEnabled?: boolean;
  onTrigger?: () => void;
  isTriggering?: boolean;
  onPreviewIntervention?: () => void;
  isPreviewing?: boolean;
};

export function PatientTpbTab({
  assessments,
  risk,
  isLoading,
  riskLoading,
  canTrigger,
  tpbEnabled,
  onTrigger,
  isTriggering,
  onPreviewIntervention,
  isPreviewing,
}: PatientTpbTabProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const triggerButton =
    canTrigger && tpbEnabled ? (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onTrigger} disabled={isTriggering}>
          <ClipboardList className="size-4" />
          {isTriggering ? "Enviando…" : "Enviar TCP agora"}
        </Button>
        {onPreviewIntervention && (
          <Button size="sm" variant="outline" onClick={onPreviewIntervention} disabled={isPreviewing}>
            {isPreviewing ? "Gerando…" : "Simular intervenção"}
          </Button>
        )}
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {riskLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : risk ? (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risco preditivo</CardTitle>
            <CardDescription>Modelo {risk.modelVersion}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge variant={risk.riskLabel.toLowerCase().includes("alto") ? "warning" : "secondary"}>
              {TPB_RISK_LABELS[risk.riskLabel] ?? risk.riskLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Score: {(risk.riskScore * 100).toFixed(0)}%
            </span>
            {risk.topFactors.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Fatores: {risk.topFactors.join(", ")}
              </span>
            )}
          </CardContent>
        </Card>
      ) : null}

      {!assessments?.length ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>TCP (Teoria do Comportamento Planejado)</CardTitle>
              <CardDescription>
                Nenhuma avaliação concluída. A escala é aplicada conforme os gatilhos em TCP, ou
                você pode disparar manualmente.
              </CardDescription>
            </div>
            {triggerButton}
          </CardHeader>
          {canTrigger && !tpbEnabled && (
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Habilite o TCP em TCP → Gatilhos para enviar manualmente.
            </CardContent>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>TCP (Teoria do Comportamento Planejado)</CardTitle>
              <CardDescription>
                {assessments.length} avaliação(ões) — construtos de atitude, norma, controle e
                intenção.
              </CardDescription>
            </div>
            {triggerButton}
          </CardHeader>
          <CardContent className="space-y-3">
            {assessments.map((a, i) => (
              <AssessmentCard key={a.id} assessment={a} index={i} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
