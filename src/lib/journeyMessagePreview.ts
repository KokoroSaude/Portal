import type { MessagePreviewVariables } from "@/lib/messagePreview";
import type { JourneyStep, MessageTemplate } from "@/types/api";

export function templateContentByKey(templates: MessageTemplate[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of templates ?? []) {
    if (t.content && t.content !== "(sem template)") {
      map.set(t.templateKey, t.content);
    }
  }
  return map;
}

export function resolveJourneyStepContent(
  step: JourneyStep,
  byKey: Map<string, string>,
): string | null {
  if (!step.templateKey) return null;
  return byKey.get(step.templateKey) ?? null;
}

export function previewVariablesForJourneyStep(step: JourneyStep): MessagePreviewVariables {
  switch (step.type) {
    case "collect_medication":
      return { nome: "Maria" };
    case "collect_schedule":
      return { nome: "Maria", medicamento: "Metformina 500mg" };
    case "confirm_care_plan":
      return {
        nome: "Maria",
        medicamento: "Metformina 500mg",
        horarios: "08:00 e 20:00",
      };
    default:
      return {};
  }
}
