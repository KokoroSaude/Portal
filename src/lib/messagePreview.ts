export type MessagePreviewVariables = {
  nome?: string;
  medicamento?: string;
  horario?: string;
  horarios?: string;
  saudacao?: string;
};

const DEFAULT_PREVIEW_VARIABLES: Required<MessagePreviewVariables> = {
  nome: "Maria",
  medicamento: "Metformina 500mg",
  horario: "08:00",
  horarios: "08:00 e 20:00",
  saudacao: "Bom dia",
};

/** Substitutes {var} and {{var}} placeholders for WhatsApp template preview. */
export function substituteMessageVariables(
  content: string,
  variables: MessagePreviewVariables = {},
): string {
  const merged = { ...DEFAULT_PREVIEW_VARIABLES, ...variables };
  let result = content;

  for (const [key, value] of Object.entries(merged)) {
    if (value == null) continue;
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }

  return result;
}
