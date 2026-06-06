import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, ChevronRight, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  countGuideSteps,
  filterGuideSections,
  getGuideForAudience,
  type GuideStep,
} from "@/lib/guides";
import { useAuth } from "@/contexts/AuthContext";
import { useTour } from "@/contexts/TourContext";
import { useTenantOnboardingChecklist } from "@/hooks/useTenantOnboardingChecklist";
import { cn } from "@/lib/utils";

function previewSteps(steps: GuideStep[], limit = 3): GuideStep[] {
  return steps.slice(0, limit);
}

export function GettingStartedCard() {
  const { isPlatform, hasFeature } = useAuth();
  const { startTour, isCompleted } = useTour();
  const checklist = useTenantOnboardingChecklist();
  const guide = getGuideForAudience(isPlatform);
  const sections = filterGuideSections(guide, hasFeature);
  const totalSteps = countGuideSteps(sections);
  const flatSteps = sections.flatMap((s) => s.steps);
  const preview = previewSteps(flatSteps);

  if (totalSteps === 0) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent/50 to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <CardTitle className="font-serif text-lg">Guia passo a passo</CardTitle>
            <CardDescription>
              {totalSteps} etapas para {isPlatform ? "configurar a plataforma" : "operar seu tenant"}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-2 text-sm">
          {preview.map((step, i) => (
            <li key={step.id} className="flex gap-2 text-muted-foreground">
              <span className="font-medium text-primary">{i + 1}.</span>
              <span>{step.title}</span>
            </li>
          ))}
          {totalSteps > preview.length && (
            <li className="text-xs text-muted-foreground">+ {totalSteps - preview.length} etapas no guia completo</li>
          )}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void startTour({ force: true })}>
            <Sparkles className="size-4" />
            {isCompleted ? "Reiniciar tour" : "Iniciar tour interativo"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/guia">
              Guia completo
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        {checklist.enabled && (
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Checklist de início</p>
              <span className="text-xs text-muted-foreground">
                {checklist.completedCount}/{checklist.totalCount} concluídos
              </span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(checklist.completedCount / checklist.totalCount) * 100}%` }}
              />
            </div>
            <ul className="space-y-2">
              {checklist.items.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60",
                      item.done && "border-primary/20 bg-primary/[0.03]",
                    )}
                  >
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("font-medium", item.done && "text-muted-foreground line-through")}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
