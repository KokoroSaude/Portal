export type MessageContentSourceValue =
  | "ai"
  | "rules"
  | "template"
  | "system"
  | "operator"
  | "patient"
  | "unknown";

export function messageContentSourceLabel(source: string | null | undefined): string {
  switch (source?.toLowerCase()) {
    case "ai":
      return "IA";
    case "rules":
      return "Regras";
    case "template":
      return "Template";
    case "system":
      return "Sistema";
    case "operator":
      return "Operador";
    case "patient":
      return "Paciente";
    default:
      return "Outro";
  }
}

export function messageContentSourceVariant(
  source: string | null | undefined,
): "default" | "secondary" | "outline" | "warning" {
  switch (source?.toLowerCase()) {
    case "ai":
      return "default";
    case "rules":
      return "warning";
    case "template":
      return "secondary";
    default:
      return "outline";
  }
}

export function timelineContentSource(meta: Record<string, unknown> | null | undefined): string | null {
  const raw = meta?.content_source ?? meta?.contentSource;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
