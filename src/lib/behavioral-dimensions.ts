import { BEHAVIORAL_DIMENSION_LABELS } from "@/lib/constants";

/** API may serialize enum as number (0–4) or string name. */
export const BEHAVIORAL_DIMENSION_ENUM: Record<number, string> = {
  0: "Lifestyle",
  1: "Habits",
  2: "Emotions",
  3: "CognitiveBias",
  4: "Comorbidity",
};

export function normalizeBehavioralDimension(dimension: unknown): string {
  if (typeof dimension === "string") return dimension;
  if (typeof dimension === "number") return BEHAVIORAL_DIMENSION_ENUM[dimension] ?? String(dimension);
  return String(dimension ?? "");
}

export function behavioralDimensionLabel(dimension: unknown): string {
  const key = normalizeBehavioralDimension(dimension);
  if (!key) return "—";
  const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
  const camel = key.charAt(0).toLowerCase() + key.slice(1);
  return (
    BEHAVIORAL_DIMENSION_LABELS[key] ??
    BEHAVIORAL_DIMENSION_LABELS[snake] ??
    BEHAVIORAL_DIMENSION_LABELS[camel] ??
    key
  );
}
