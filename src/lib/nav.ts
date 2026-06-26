/** NavLink active quando path e query batem (ex.: /configuracoes?tab=ia). */
export function isNavToActive(to: string, pathname: string, search: string): boolean {
  const qIndex = to.indexOf("?");
  const path = qIndex >= 0 ? to.slice(0, qIndex) : to;
  if (pathname !== path) return false;

  if (qIndex < 0) {
    return !search || search === "?";
  }

  const expected = new URLSearchParams(to.slice(qIndex + 1));
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  for (const [key, val] of expected.entries()) {
    const cur = current.get(key);
    if (key === "tab" && val === "operacao" && !cur) return true;
    if (cur !== val) return false;
  }

  return true;
}
