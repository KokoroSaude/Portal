import type { TenantSettings } from "@/types/api";

export type AiAvailabilityStatus = "ready" | "disabled" | "unconfigured";

export function getAiAvailability(settings?: TenantSettings | null): AiAvailabilityStatus {
  if (!settings?.aiFeatures?.platformConfigured) return "unconfigured";
  if (!settings.aiEnabled) return "disabled";
  return "ready";
}

export function aiSourceLabel(source: string): string {
  if (source === "ai") return "IA";
  if (source === "mixed") return "IA + Regras";
  return "Regras";
}

export function aiAvailabilityHint(status: AiAvailabilityStatus, isPlatformAdmin: boolean): string {
  switch (status) {
    case "ready":
      return "IA habilitada neste tenant e chave da plataforma configurada.";
    case "disabled":
      return "A chave da plataforma está ok, mas a IA está desligada nas configurações do tenant.";
    case "unconfigured":
      return isPlatformAdmin
        ? "Configure a chave do provedor em Admin → Configuração de IA."
        : "A chave de IA da plataforma ainda não foi configurada pelo suporte Kokoro.";
  }
}
