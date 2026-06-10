import { useState } from "react";
import { AlertTriangle, ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MORISKY_LEVEL_LABELS, MORISKY_TRIGGER_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { MoriskyAssessmentDetail } from "@/types/api";

function DeltaBadge({ delta }: { delta: number | null | undefined }) {
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
      {delta} pts vs anterior
    </Badge>
  );
}

function AssessmentCard({ assessment, index }: { assessment: MoriskyAssessmentDetail; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const changedCount = assessment.answers.filter((a) => a.changedFromPrevious === true).length;

  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {formatDateTime(assessment.completedAt)}
            </span>
            <Badge variant="secondary">
              {MORISKY_TRIGGER_LABELS[assessment.trigger] ?? assessment.trigger}
            </Badge>
            <Badge variant="outline">
              {MORISKY_LEVEL_LABELS[assessment.level] ?? assessment.level}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {assessment.score}/{assessment.maxScore}
            </span>
            <DeltaBadge delta={assessment.scoreDeltaFromPrevious} />
          </div>
          {assessment.levelChanged && assessment.previousLevel && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Nível alterado: {MORISKY_LEVEL_LABELS[assessment.previousLevel] ?? assessment.previousLevel}{" "}
              → {MORISKY_LEVEL_LABELS[assessment.level] ?? assessment.level}
            </p>
          )}
          {changedCount > 0 && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="size-3 text-amber-500" />
              {changedCount} pergunta(s) com resposta diferente da avaliação anterior
            </p>
          )}
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-2">
          <ol className="space-y-2">
            {assessment.answers.map((q) => (
              <li
                key={q.questionId}
                className={cn(
                  "flex gap-3 rounded-lg px-3 py-2 text-sm",
                  q.changedFromPrevious && "bg-amber-50/80 dark:bg-amber-950/30",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {q.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p>{q.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resposta: <strong>{q.answerLabel}</strong>
                    {q.changedFromPrevious && q.previousAnswerLabel && (
                      <>
                        {" "}
                        <span className="text-amber-700 dark:text-amber-300">
                          (antes: {q.previousAnswerLabel})
                        </span>
                      </>
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

type PatientMoriskyTabProps = {
  assessments: MoriskyAssessmentDetail[] | undefined;
  isLoading: boolean;
};

export function PatientMoriskyTab({ assessments, isLoading }: PatientMoriskyTabProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!assessments?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MMAS-8 (Morisky)</CardTitle>
          <CardDescription>
            Nenhuma avaliação concluída ainda. A escala é aplicada conforme os gatilhos
            configurados em Configurações → MMAS-8.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MMAS-8 (Morisky)</CardTitle>
        <CardDescription>
          {assessments.length} avaliação(ões) — expanda para ver respostas e mudanças em relação à
          anterior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessments.map((a, i) => (
          <AssessmentCard key={a.id} assessment={a} index={i} />
        ))}
      </CardContent>
    </Card>
  );
}
