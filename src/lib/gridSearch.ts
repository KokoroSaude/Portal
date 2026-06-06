export function normalizeGridSearch(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesGridSearch(
  query: string,
  ...parts: (string | number | null | undefined)[]
): boolean {
  const q = normalizeGridSearch(query);
  if (!q) return true;
  return parts.some((part) => String(part ?? "").toLowerCase().includes(q));
}
