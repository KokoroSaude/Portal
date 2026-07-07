export type VoiceCatalogCategory = "geral" | "morisky" | "tcp";

/** Espelha VoiceTtsCatalogCategory da API — fallback quando o campo category não vier no JSON. */
export function resolveVoiceCatalogCategory(
  templateKey: string | null | undefined,
  apiCategory?: string | null,
): VoiceCatalogCategory {
  if (apiCategory === "geral" || apiCategory === "morisky" || apiCategory === "tcp")
    return apiCategory;

  if (!templateKey) return "geral";
  if (templateKey.startsWith("morisky.")) return "morisky";
  if (templateKey.startsWith("tpb.")) return "tcp";
  return "geral";
}
