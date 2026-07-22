import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, CircleDashed, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import type { BctPackItem, BctPackStatus } from "@/types/api";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

const TOGGLES_ID = "bct-toggles";

const STATUS_META: Record<
  BctPackStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  on: {
    label: "Ligado",
    icon: CheckCircle2,
    className: "border-emerald-300 text-emerald-800",
  },
  partial: {
    label: "Parcial",
    icon: CircleDashed,
    className: "border-amber-300 text-amber-800",
  },
  off: {
    label: "Desligado",
    icon: PauseCircle,
    className: "border-muted-foreground/40 text-muted-foreground",
  },
};

/** Paths that point back to this page (API historically linked Configurar → /configuracoes/bct). */
function isBctPackSelfPath(path: string | null | undefined): boolean {
  if (!path) return false;
  const bare = path.split("?")[0]?.split("#")[0] ?? path;
  return bare === "/configuracoes/bct" || bare.endsWith("/configuracoes/bct");
}

function featureToToggleKey(featureKey: string | null | undefined): string | null {
  switch (featureKey) {
    case FEATURE_KEYS.behavioralGoals:
      return "behaviourGoalsEnabled";
    case FEATURE_KEYS.engagementAwayMode:
      return "awayModeEnabled";
    case FEATURE_KEYS.engagementIndicationCards:
      return "indicationCardsEnabled";
    case FEATURE_KEYS.engagementCaregiver:
      return "caregiverEscalationEnabled";
    case FEATURE_KEYS.behavioralSelectiveSkip:
      return "selectiveSkipEnabled";
    default:
      return null;
  }
}

function BctRow({
  item,
  canEditToggles,
  onConfigureHere,
}: {
  item: BctPackItem;
  canEditToggles: boolean;
  onConfigureHere: (featureKey: string | null | undefined) => void;
}) {
  const location = useLocation();
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;
  const selfPath = isBctPackSelfPath(item.settingsPath);
  const samePage =
    selfPath &&
    (location.pathname === "/configuracoes/bct" ||
      location.pathname.endsWith("/configuracoes/bct"));

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{item.bctName}</p>
          <Badge variant="outline" className={meta.className}>
            <Icon className="mr-1 size-3" />
            {meta.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.kokoroCapability}</p>
        {item.patientSees && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">No WhatsApp: </span>
            {item.patientSees}
          </p>
        )}
      </div>
      {item.settingsPath &&
        (samePage || selfPath ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              if (!canEditToggles) {
                toast.message("Somente administradores podem ligar os toggles do pack BCT.");
                return;
              }
              onConfigureHere(item.featureKey);
            }}
          >
            {canEditToggles ? "Ativar abaixo" : "Configurar"}
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={item.settingsPath}>
              Configurar
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        ))}
    </div>
  );
}

export function BctPackPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { form, update, save, savePending, isLoading: settingsLoading } = useTenantSettingsForm();
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const pack = useQuery({
    queryKey: ["bct-pack"],
    queryFn: () => api.getBctPack(token!),
    enabled: !!token && (hasFeature(FEATURE_KEYS.behavioralProfile) || isAdmin),
  });

  const scrollToToggles = useCallback((featureKey?: string | null) => {
    const toggleKey = featureToToggleKey(featureKey);
    if (toggleKey) {
      setHighlightKey(toggleKey);
      window.setTimeout(() => setHighlightKey(null), 2500);
    }
    requestAnimationFrame(() => {
      document.getElementById(TOGGLES_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    if (location.hash === "#toggles" || location.hash === `#${TOGGLES_ID}`) {
      scrollToToggles(null);
    }
  }, [location.hash, scrollToToggles]);

  if (!isAdmin && !hasFeature(FEATURE_KEYS.behavioralProfile)) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Pack BCT (Patton 2017)"
          description="Mapeamento operacional das 11 técnicas de mudança de comportamento."
        />
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Requer o módulo de perfil comportamental ou acesso de administrador.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pack BCT (Patton 2017)"
        description="Intervenção em poli-medicação via TDF → 11 BCTs. Canal Kokoro = WhatsApp + portal clínico."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary" />
            Mapa Patton × Kokoro
          </CardTitle>
          <CardDescription>
            Status derivado das feature flags e settings reais do tenant (sem tabela separada).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pack.isLoading && (
            <>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </>
          )}
          {pack.data?.items.map((item) => (
            <BctRow
              key={item.bctKey}
              item={item}
              canEditToggles={Boolean(isAdmin && form)}
              onConfigureHere={scrollToToggles}
            />
          ))}
          {pack.isError && (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o read model. Confira se a API expõe GET /api/tenants/me/bct-pack.
            </p>
          )}
        </CardContent>
      </Card>

      {isAdmin && form && (
        <Card id={TOGGLES_ID} className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg">Toggles do pack (opt-in)</CardTitle>
            <CardDescription>
              Defaults OFF (WhatsApp). No plano Enterprise a feature já vem liberada — ligue aqui
              para ativar no paciente. Depois, faça logout/login se o menu não atualizar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                ["behaviourGoalsEnabled", "Metas + review semanal", "behavioral.goals"],
                ["awayModeEnabled", "Modo fora de rotina (viagem)", "engagement.away_mode"],
                ["indicationCardsEnabled", "Cards de indicação curados", "engagement.indication_cards"],
                ["caregiverEscalationEnabled", "Cuidador com consentimento", "engagement.caregiver"],
                ["selectiveSkipEnabled", "Detector de skip seletivo", "behavioral.selective_skip"],
              ] as const
            ).map(([key, label, feature]) => (
              <div
                key={key}
                data-toggle-key={key}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors",
                  highlightKey === key && "border-primary bg-primary/5 ring-2 ring-primary/30",
                )}
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{feature}</p>
                </div>
                <Switch
                  checked={Boolean(form[key])}
                  onCheckedChange={(checked) => update(key, checked)}
                  disabled={settingsLoading || savePending}
                />
              </div>
            ))}
            <Button
              onClick={() => {
                void save();
                void queryClient.invalidateQueries({ queryKey: ["bct-pack"] });
              }}
              disabled={savePending || settingsLoading}
            >
              Salvar toggles
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
