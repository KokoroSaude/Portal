import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  countGuideSteps,
  filterGuideSections,
  getGuideForAudience,
  type GuideStep,
} from "@/lib/guides";
import { useAuth } from "@/contexts/AuthContext";

function previewSteps(steps: GuideStep[], limit = 3): GuideStep[] {
  return steps.slice(0, limit);
}

export function GettingStartedCard() {
  const { isPlatform, hasFeature } = useAuth();
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
        <Button asChild>
          <Link to="/guia">
            Abrir guia completo
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
