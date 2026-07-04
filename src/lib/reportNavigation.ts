const TENANT_SEARCH_PREFIXES = [
  "/relatorios/engajamento",
  "/relatorios/operacao",
  "/relatorios/escalas",
  "/relatorios/conversacional",
  "/relatorios/programa-medicamento",
];

const ADMIN_SEARCH_PREFIXES = [
  "/admin/relatorios/engajamento",
  "/admin/relatorios/operacao",
  "/admin/relatorios/escalas",
  "/admin/relatorios/rastreabilidade",
  "/admin/relatorios/remetentes",
  "/admin/relatorios/comparativo",
];

export function reportPathHasSearch(pathname: string): boolean {
  return (
    TENANT_SEARCH_PREFIXES.some((p) => pathname.startsWith(p)) ||
    ADMIN_SEARCH_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

export function reportSearchPlaceholder(pathname: string): string {
  if (pathname.includes("conversacional")) return "Buscar paciente, tipo ou origem…";
  if (pathname.includes("rastreabilidade")) return "Buscar evento ou detalhe…";
  if (pathname.includes("remetentes") || pathname.includes("operacao")) {
    return "Buscar remetente ou telefone…";
  }
  if (pathname.includes("escalas")) return "Buscar paciente ou nível…";
  return "Buscar nesta página…";
}

export function resolveReportTab(
  tab: string | null,
  defaultTab: string,
  allowed: string[],
): string {
  if (tab && allowed.includes(tab)) return tab;
  return defaultTab;
}
