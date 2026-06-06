export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "onboarding", label: "Onboarding" },
  { id: "checkin", label: "Lembretes" },
  { id: "followup", label: "Follow-up" },
  { id: "reengagement", label: "Reengajamento" },
  { id: "milestone", label: "Marcos" },
  { id: "pause", label: "Pausa" },
  { id: "optout", label: "Opt-out" },
  { id: "custom", label: "Personalizadas" },
  { id: "message", label: "Sistema" },
  { id: "other", label: "Outras" },
] as const;

export type TemplateCategoryId = (typeof TEMPLATE_CATEGORIES)[number]["id"];

export const TEMPLATE_KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export function categoryLabel(id: string) {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function buildTemplateKey(baseKey: string, tone: string) {
  return `${baseKey}.${tone}`;
}
