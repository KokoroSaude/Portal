import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import { aiSourceLabel } from "@/lib/ai-status";
import { api, ApiClientError } from "@/lib/api";
import type { ReportInsight, TenantSettings } from "@/types/api";

type Props = {
  token: string;
  patientId: string;
  tenantSettings?: TenantSettings | null;
  platformConfiguredOverride?: boolean;
};

export function PatientAiInsightCard({
  token,
  patientId,
  tenantSettings,
  platformConfiguredOverride,
}: Props) {
  const insight = useMutation({
    mutationFn: () => api.getPatientInsight(token, patientId),
    onError: (err) => {
      const msg = err instanceof ApiClientError ? err.message : "Não foi possível gerar o resumo.";
      toast.error(msg);
    },
  });

  const data = insight.data as ReportInsight | undefined;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Sparkles className="size-5 text-primary" />
            Resumo do paciente
          </CardTitle>
          <CardDescription>
            Visão consolidada de adesão, engajamento e atividade recente.
          </CardDescription>
          <PatientAiAvailabilityBadge
            settings={tenantSettings}
            platformConfiguredOverride={platformConfiguredOverride}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => insight.mutate()}
          disabled={insight.isPending}
        >
          {insight.isPending ? "Gerando…" : "Gerar resumo"}
        </Button>
      </CardHeader>
      {data && (
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={data.source === "ai" ? "default" : "secondary"}>
              {aiSourceLabel(data.source)}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>
          {data.highlights.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Destaques
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {data.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.actions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações sugeridas
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {data.actions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
