export const ADMIN_TEMPLATE_TONES = [
  { value: "acolhedor", label: "Acolhedor" },
  { value: "motivacional", label: "Motivacional" },
  { value: "direto", label: "Direto" },
] as const;

export function adminTemplateToneLabel(tone: string) {
  return ADMIN_TEMPLATE_TONES.find((t) => t.value === tone)?.label ?? tone;
}
