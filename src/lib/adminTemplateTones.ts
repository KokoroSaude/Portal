export const ADMIN_TEMPLATE_TONES = [
  { value: "acolhedor", label: "Acolhedor" },
  { value: "motivacional", label: "Motivacional" },
  { value: "direto", label: "Direto" },
] as const;

const VOICE_TONE_SLUGS = ADMIN_TEMPLATE_TONES.map((t) => t.value);
const VOICE_TONE_LABELS = ADMIN_TEMPLATE_TONES.map((t) => t.label);

/** API may return VoiceTone as enum number (0–2) or string. */
export function normalizeVoiceToneSlug(value: unknown): string {
  if (typeof value === "number" && value >= 0 && value < VOICE_TONE_SLUGS.length) {
    return VOICE_TONE_SLUGS[value];
  }
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (VOICE_TONE_SLUGS.includes(lower as (typeof VOICE_TONE_SLUGS)[number])) return lower;
    const idx = Number(value);
    if (!Number.isNaN(idx) && idx >= 0 && idx < VOICE_TONE_SLUGS.length) {
      return VOICE_TONE_SLUGS[idx];
    }
    const labelIdx = VOICE_TONE_LABELS.findIndex((l) => l.toLowerCase() === lower);
    if (labelIdx >= 0) return VOICE_TONE_SLUGS[labelIdx];
  }
  return "acolhedor";
}

/** Pascal-case value for Settings select (Acolhedor, Motivacional, Direto). */
export function normalizeVoiceToneSelectValue(value: unknown): string {
  const slug = normalizeVoiceToneSlug(value);
  const idx = VOICE_TONE_SLUGS.indexOf(slug as (typeof VOICE_TONE_SLUGS)[number]);
  return VOICE_TONE_LABELS[idx] ?? "Acolhedor";
}

export function adminTemplateToneLabel(tone: string) {
  return ADMIN_TEMPLATE_TONES.find((t) => t.value === tone)?.label ?? tone;
}
