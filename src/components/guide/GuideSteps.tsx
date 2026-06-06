import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuideSection } from "@/lib/guides";
import { cn } from "@/lib/utils";

type GuideStepsProps = {
  sections: GuideSection[];
  className?: string;
};

export function GuideSteps({ sections, className }: GuideStepsProps) {
  let stepNumber = 0;

  return (
    <div className={cn("space-y-10", className)}>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`guide-section-${section.id}`}>
          <div className="mb-4">
            <h2 id={`guide-section-${section.id}`} className="font-serif text-xl text-foreground">
              {section.title}
            </h2>
            {section.description && (
              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
            )}
          </div>

          <ol className="relative space-y-0 border-l border-border/80 pl-6 sm:pl-8">
            {section.steps.map((step) => {
              stepNumber += 1;
              const n = stepNumber;
              return (
                <li key={step.id} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute -left-6 flex size-10 items-center justify-center rounded-full border-2 border-primary bg-background font-serif text-sm font-semibold text-primary sm:-left-8 sm:size-11"
                    aria-hidden
                  >
                    {n}
                  </span>

                  <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>

                    {step.tips && step.tips.length > 0 && (
                      <ul className="mt-3 space-y-1.5 rounded-lg bg-accent/40 px-3 py-2.5 text-xs text-muted-foreground">
                        {step.tips.map((tip) => (
                          <li key={tip} className="flex gap-2">
                            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link to={step.to}>
                        Ir para esta etapa
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
