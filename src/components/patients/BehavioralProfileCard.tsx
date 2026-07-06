import { Brain, ClipboardList, MapPin, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { behavioralDimensionLabel } from "@/lib/behavioral-dimensions";
import { BEHAVIORAL_SOURCE_LABELS, TPB_CONSTRUCT_DESCRIPTIONS, TPB_RISK_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { PatientBehavioralProfile, PatientTpbRisk } from "@/types/api";

function DimensionBars({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  if (entries.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{behavioralDimensionLabel(key)}</span>
            <span>{Math.round(value * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                value < 0.4 ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${Math.min(100, value * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type BehavioralProfileCardProps = {
  profile: PatientBehavioralProfile | undefined;
  tpbRisk: PatientTpbRisk | undefined;
  isLoading: boolean;
  riskLoading?: boolean;
};

export function BehavioralProfileCard({
  profile,
  tpbRisk,
  isLoading,
  riskLoading,
}: BehavioralProfileCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasProfile =
    profile &&
    profile.computedAt &&
    profile.computedAt !== "0001-01-01T00:00:00Z" &&
    Object.keys(profile.dimensionScores).length > 0;

  const hasTpbLayer =
    profile?.tpbConstructs && Object.keys(profile.tpbConstructs).length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={hasTpbLayer ? "border-primary/30" : "border-dashed"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Brain className="size-4 text-primary" />
              1. Construtos TCP (Ajzen)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Atitude, normas subjetivas, controle percebido e intenção — medidos na escala TCP.
          </CardContent>
        </Card>
        <Card className={profile?.observedBehavior ? "border-primary/30" : "border-dashed"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="size-4 text-primary" />
              2. Comportamento observado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Morisky + check-ins dos últimos 30 dias — adesão real, não só intenção.
          </CardContent>
        </Card>
        <Card className={hasProfile ? "border-primary/30" : "border-dashed"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="size-4 text-primary" />
              3. Barreiras integradas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Avaliação estratégica + perfil fundido — barreira principal para nudges.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil comportamental atual</CardTitle>
          <CardDescription>
            {hasProfile
              ? `Atualizado em ${formatDateTime(profile.computedAt)}`
              : "Preencha a avaliação estratégica ou aguarde TCP/Morisky no WhatsApp."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasProfile ? (
            <p className="text-sm text-muted-foreground">
              Nenhum perfil calculado ainda. Salve o formulário estratégico para gerar o primeiro
              snapshot.
            </p>
          ) : (
            <>
              {profile.primaryBarrier && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Barreira principal:</span>
                  <Badge variant="secondary">
                    {behavioralDimensionLabel(profile.primaryBarrier)}
                  </Badge>
                </div>
              )}

              <DimensionBars scores={profile.dimensionScores} />

              {hasTpbLayer && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Construtos TCP</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.tpbConstructs!).map(([key, score]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {(TPB_CONSTRUCT_DESCRIPTIONS as Record<string, { title: string }>)[key]
                          ?.title ?? key}
                        : {score.toFixed(1)}/5
                      </Badge>
                    ))}
                  </div>
                  {profile.weakestConstruct && (
                    <p className="text-xs text-muted-foreground">
                      Construto mais fraco:{" "}
                      <strong>
                        {(TPB_CONSTRUCT_DESCRIPTIONS as Record<string, { title: string }>)[
                          profile.weakestConstruct
                        ]?.title ?? profile.weakestConstruct}
                      </strong>
                    </p>
                  )}
                  {profile.intentionBehaviorGap != null && (
                    <p className="text-xs text-muted-foreground">
                      Gap intenção→adesão (30d): {(profile.intentionBehaviorGap * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}

              {profile.observedBehavior && (
                <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Comportamento observado (30d)</p>
                  {profile.observedBehavior.adherenceRate30d != null && (
                    <p>
                      Adesão check-ins:{" "}
                      {(profile.observedBehavior.adherenceRate30d * 100).toFixed(0)}%
                    </p>
                  )}
                  {profile.observedBehavior.lastMoriskyScore != null && (
                    <p>Morisky: {profile.observedBehavior.lastMoriskyScore}</p>
                  )}
                  <p>Check-ins: {profile.observedBehavior.checkinCount30d}</p>
                </div>
              )}

              {profile.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.sources.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {BEHAVIORAL_SOURCE_LABELS[s] ?? s}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}

          {(riskLoading || tpbRisk) && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Risco de não adesão (TCP)</p>
              {riskLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : tpbRisk ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      tpbRisk.riskLabel === "Alto" && "border-red-300 text-red-800",
                      tpbRisk.riskLabel === "Médio" && "border-amber-300 text-amber-800",
                    )}
                  >
                    {TPB_RISK_LABELS[tpbRisk.riskLabel] ?? tpbRisk.riskLabel}
                  </Badge>
                  <span className="text-muted-foreground">
                    Score {(tpbRisk.riskScore * 100).toFixed(0)}%
                  </span>
                  {tpbRisk.topFactors.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      · {tpbRisk.topFactors.join(", ")}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            Nudges geolocalizados ativos quando o paciente compartilha localização no WhatsApp com
            opt-in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
