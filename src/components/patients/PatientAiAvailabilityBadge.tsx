import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  aiAvailabilityHint,
  getAiAvailability,
  type AiAvailabilityStatus,
} from "@/lib/ai-status";
import type { TenantSettings } from "@/types/api";

const VARIANT: Record<AiAvailabilityStatus, "success" | "muted" | "warning"> = {
  ready: "success",
  disabled: "muted",
  unconfigured: "warning",
};

const LABEL: Record<AiAvailabilityStatus, string> = {
  ready: "IA ativa",
  disabled: "IA desligada",
  unconfigured: "IA indisponível",
};

type Props = {
  settings?: TenantSettings | null;
  isLoading?: boolean;
  isPlatformAdmin?: boolean;
  canConfigureTenant?: boolean;
};

export function PatientAiAvailabilityBadge({
  settings,
  isLoading,
  isPlatformAdmin = false,
  canConfigureTenant = false,
}: Props) {
  if (isLoading) {
    return (
      <Badge variant="muted" title="Verificando configuração de IA…">
        <Sparkles className="mr-1 size-3 opacity-60" />
        IA…
      </Badge>
    );
  }

  const status = getAiAvailability(settings);
  const hint = aiAvailabilityHint(status, isPlatformAdmin);

  const badge = (
    <Badge variant={VARIANT[status]} title={hint}>
      <Sparkles className="mr-1 size-3" />
      {LABEL[status]}
    </Badge>
  );

  if (status === "disabled" && canConfigureTenant) {
    return (
      <Link
        to="/configuracoes"
        className="inline-flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={`${hint} Clique para abrir configurações.`}
      >
        {badge}
      </Link>
    );
  }

  if (status === "unconfigured" && isPlatformAdmin) {
    return (
      <Link
        to="/admin/configuracao"
        className="inline-flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={`${hint} Clique para configurar.`}
      >
        {badge}
      </Link>
    );
  }

  return badge;
}
