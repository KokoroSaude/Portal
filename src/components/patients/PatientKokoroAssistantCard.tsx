import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import type { InsightPreviewMode } from "@/components/patients/PatientInsightPreviewModeToggle";
import { TPB_CONSTRUCT_LABELS, TPB_RISK_LABELS } from "@/lib/constants";
import { aiSourceLabel, getAiAvailability } from "@/lib/ai-status";
import { api, ApiClientError } from "@/lib/api";
import { formatDateTime, formatPercent } from "@/lib/utils";
import type { PatientAiBrief, PatientAiSuggestions, TenantSettings } from "@/types/api";

type Props = {
  token: string;
  patientId: string;
  canWrite?: boolean;
  tenantSettings?: TenantSettings | null;
  platformConfiguredOverride?: boolean;
  previewMode?: InsightPreviewMode;
  onTriggerTpb?: () => void;
};

export function PatientKokoroAssistantCard({
  token,
  patientId,
  canWrite,
  tenantSettings,
  platformConfiguredOverride,
  previewMode = "auto",
  onTriggerTpb,
}: Props) {
  const brief = useMutation({
    mutationFn: () => api.getPatientAiBrief(token, patientId, previewMode),
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Não foi possível gerar o resumo.");
    },
  });

  const suggestions = useMutation({
    mutationFn: () => api.getPatientAiSuggestions(token, patientId),
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Não foi possível carregar sugestões.");
    },
  });

  const data = brief.data as PatientAiBrief | undefined;
  const sugData = suggestions.data as PatientAiSuggestions | undefined;

  function loadAll() {
    brief.mutate();
    suggestions.mutate();
  }

  const loading = brief.isPending || suggestions.isPending;
  const aiReady = getAiAvailability(tenantSettings, platformConfiguredOverride) === "ready";

  useEffect(() => {
    if (brief.data) brief.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when admin preview mode changes
  }, [previewMode]);

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Sparkles className="size-5 text-primary" />
            Assistente Kokoro
          </CardTitle>
          <CardDescription>
            Resumo com adesão, TCP, MMAS-8 e risco preditivo — com sugestões de ação.
          </CardDescription>
          <PatientAiAvailabilityBadge
            settings={tenantSettings}
            platformConfiguredOverride={platformConfiguredOverride}
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          {loading ? "Carregando…" : "Atualizar assistente"}
        </Button>
      </CardHeader>

      {!data && !loading && !aiReady && (
        <CardContent className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Ative a IA nas configurações do tenant e configure a chave da plataforma para gerar resumos
            com LLM. Enquanto isso, o assistente usará apenas regras determinísticas.
          </p>
        </CardContent>
      )}

      {!data && !loading && aiReady && (
        <CardContent className="space-y-2 border-t pt-4">
          {brief.isError ? (
            <p className="text-sm text-destructive">
              {brief.error instanceof ApiClientError
                ? brief.error.message
                : "Não foi possível carregar o assistente."}
              {" "}
              Tente <strong>Atualizar assistente</strong> de novo.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em <strong>Atualizar assistente</strong> para gerar o resumo com TCP, MMAS-8 e sugestões.
            </p>
          )}
        </CardContent>
      )}

      {data && brief.isError && (
        <CardContent className="border-t pt-4">
          <p className="text-sm text-amber-800">
            Última atualização falhou
            {brief.error instanceof ApiClientError ? `: ${brief.error.message}` : ""}. Exibindo resultado anterior.
          </p>
        </CardContent>
      )}

      {data && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                data.source === "ai"
                  ? "default"
                  : previewMode === "auto" && aiReady && data.source === "rules"
                    ? "warning"
                    : "secondary"
              }
              title={`Gerado em ${formatDateTime(data.generatedAt)}`}
            >
              Resumo: {aiSourceLabel(data.source, { aiReady: previewMode === "auto" && aiReady, kind: "insight", previewMode })}
            </Badge>
            {data.context.risk && (
              <Badge variant="outline">
                Risco: {TPB_RISK_LABELS[data.context.risk.riskLabel] ?? data.context.risk.riskLabel}
              </Badge>
            )}
          </div>

          <p className="text-sm leading-relaxed">{data.summary}</p>

          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Adesão 30d</p>
              <p className="font-semibold">{formatPercent(data.context.adherenceRate30d)}</p>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Misses seguidos</p>
              <p className="font-semibold">{data.context.consecutiveMisses}</p>
            </div>
            {data.context.tpbIntentionScore != null && (
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Intenção TCP</p>
                <p className="font-semibold">{data.context.tpbIntentionScore.toFixed(1)}/5</p>
              </div>
            )}
            {data.context.moriskyScore != null && (
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">MMAS-8</p>
                <p className="font-semibold">{data.context.moriskyScore}</p>
              </div>
            )}
          </div>

          {data.context.tpbConstructScores && Object.keys(data.context.tpbConstructScores).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Construtos TCP
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.context.tpbConstructScores).map(([k, v]) => (
                  <Badge key={k} variant="outline">
                    {TPB_CONSTRUCT_LABELS[k] ?? k}: {v.toFixed(1)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.highlights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {data.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </CardContent>
      )}

      {sugData && sugData.suggestions.length > 0 && (
        <CardContent className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <p className="text-sm font-medium">Sugestões</p>
            <Badge
              variant={
                sugData.source === "rules" && !aiReady
                  ? "secondary"
                  : sugData.source === "deterministic"
                    ? "outline"
                    : "default"
              }
              className="text-xs"
            >
              {aiSourceLabel(sugData.source, { aiReady, kind: "suggestions" })}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {sugData.suggestions.map((s) => (
              <div key={s.id} className="rounded-xl border bg-background/80 p-4">
                <p className="font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                {canWrite && s.actionType === "trigger_tpb" && onTriggerTpb && (
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onTriggerTpb}>
                    Disparar TCP
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
