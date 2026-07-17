import { DOCS_URL } from "@/lib/auth-redirect";

/**
 * Mapeia rotas do portal → paths do MkDocs (docs.kokorosaude.com.br).
 * Só páginas com documentação real devem entrar aqui.
 */
const PAGE_DOCS: Array<{ match: RegExp; path: string | ((pathname: string, search: string) => string | null) }> = [
  // Dashboard / guia
  { match: /^\/$/, path: "operacao/dashboard" },
  { match: /^\/guia$/, path: "checklist-primeiros-passos" },

  // Pacientes
  { match: /^\/pacientes$/, path: "pacientes/gestao" },
  { match: /^\/pacientes\/[^/]+$/, path: "pacientes/ficha-paciente" },
  { match: /^\/pacientes\/[^/]+\/rede-cuidado$/, path: "pacientes/rede-cuidado" },
  { match: /^\/pacientes\/[^/]+\/mmas-8$/, path: "escalas/morisky" },
  { match: /^\/pacientes\/[^/]+\/tcp$/, path: "escalas/tcp" },
  { match: /^\/pacientes\/[^/]+\/perfil-comportamental$/, path: "programa/engajamento-detalhado" },
  { match: /^\/pacientes\/[^/]+\/assistente-ia$/, path: "inteligencia-artificial/geral" },

  // Relatórios
  { match: /^\/relatorios$/, path: "relatorios/index" },
  { match: /^\/relatorios\/adesao$/, path: "relatorios/adesao" },
  { match: /^\/relatorios\/engajamento$/, path: "relatorios/engajamento" },
  { match: /^\/relatorios\/operacao$/, path: "relatorios/operacao" },
  { match: /^\/relatorios\/escalas$/, path: "relatorios/escalas-relatorio" },
  { match: /^\/relatorios\/conversacional$/, path: "relatorios/conversacional" },
  { match: /^\/relatorios\/programa-medicamento$/, path: "relatorios/programa-medicamento" },

  // Programa / conteúdo
  { match: /^\/medicamentos$/, path: "programa/medicamentos" },
  { match: /^\/programas$/, path: "programa/programas-terapeuticos" },
  { match: /^\/programas-suporte$/, path: "programa/programas-terapeuticos" },
  { match: /^\/conhecimento$/, path: "programa/base-conhecimento" },
  { match: /^\/templates$/, path: "whatsapp/templates" },
  { match: /^\/jornada$/, path: "whatsapp/jornada" },

  // WhatsApp
  { match: /^\/whatsapp\/promocoes$/, path: "whatsapp/promocoes" },
  { match: /^\/whatsapp\/configuracao$/, path: "whatsapp/remetentes" },

  // Escalas (settings)
  { match: /^\/morisky$/, path: "escalas/morisky" },
  { match: /^\/tcp$/, path: "escalas/tcp" },
  { match: /^\/tcp\/ciencia$/, path: "escalas/tcp" },

  // Configurações
  {
    match: /^\/configuracoes$/,
    path: (_p, search) => {
      const tab = new URLSearchParams(search).get("tab");
      switch (tab) {
        case "engajamento":
          return "configuracoes/engajamento";
        case "onboarding":
          return "configuracoes/onboarding";
        case "pesquisas":
          return "configuracoes/pesquisas";
        case "operacao":
        default:
          return "configuracoes/operacao";
      }
    },
  },
  { match: /^\/configuracoes\/usuarios$/, path: "configuracoes/usuarios" },
  { match: /^\/configuracoes\/retirada$/, path: "farmacia-sus/retirada-operacao" },
  { match: /^\/configuracoes\/saude-publica$/, path: "farmacia-sus/index" },
  { match: /^\/configuracoes\/bct$/, path: "configuracoes/pack-bct" },
  { match: /^\/configuracoes\/fhir$/, path: "configuracoes/fhir-smart" },
  { match: /^\/configuracoes\/ia$/, path: "inteligencia-artificial/geral" },
  { match: /^\/configuracoes\/ia\/geral$/, path: "inteligencia-artificial/geral" },
  { match: /^\/configuracoes\/ia\/mensagens$/, path: "inteligencia-artificial/mensagens-outbound" },
  { match: /^\/configuracoes\/ia\/prompts$/, path: "inteligencia-artificial/prompts" },
  {
    match: /^\/configuracoes\/ia\/conversacao\/modos$/,
    path: "inteligencia-artificial/conversacao-modos",
  },
  {
    match: /^\/configuracoes\/ia\/conversacao\/handoff$/,
    path: "inteligencia-artificial/handoff-timing",
  },
  {
    match: /^\/configuracoes\/ia\/conversacao\/automacao$/,
    path: "inteligencia-artificial/automacao",
  },
  { match: /^\/configuracoes\/simulador$/, path: "inteligencia-artificial/simulador" },

  // Farmácia SUS
  { match: /^\/farmacia$/, path: "farmacia-sus/index" },
  { match: /^\/farmacia\/retiradas$/, path: "farmacia-sus/retirada" },
  { match: /^\/farmacia\/relatorios$/, path: "farmacia-sus/relatorios-retirada" },
  { match: /^\/farmacia\/fila-cronica$/, path: "farmacia-sus/fila-cronica" },
  { match: /^\/farmacia\/tv$/, path: "farmacia-sus/painel-tv" },

  // Conta
  { match: /^\/perfil$/, path: "conta/perfil-seguranca" },

  // Plataforma (admin)
  { match: /^\/admin\/tenants$/, path: "plataforma/organizacoes" },
  { match: /^\/admin\/tenants\/excluidas$/, path: "plataforma/organizacoes" },
  { match: /^\/admin\/relatorios$/, path: "plataforma/relatorios-multi-org" },
  { match: /^\/admin\/relatorios\//, path: "plataforma/relatorios-multi-org" },
  { match: /^\/admin\/usuarios$/, path: "plataforma/superadmins" },
  { match: /^\/admin\/assinatura$/, path: "plataforma/assinatura-email" },
  { match: /^\/admin\/onboarding$/, path: "plataforma/onboarding-global" },
  { match: /^\/admin\/mensagens$/, path: "plataforma/mensagens-globais" },
  { match: /^\/admin\/templates-meta$/, path: "plataforma/templates-meta" },
  { match: /^\/admin\/vozes$/, path: "plataforma/catalogo-vozes" },
  { match: /^\/admin\/configuracao$/, path: "plataforma/configuracao-plataforma" },
  { match: /^\/admin\/logs-comunicacao$/, path: "plataforma/whatsapp-diagnosticos" },
  { match: /^\/admin\/prompts-ia$/, path: "plataforma/arquitetura/ia-rag" },
];

function docsPathToUrl(path: string): string {
  const clean = path.replace(/\.md$/i, "").replace(/\/index$/i, "").replace(/^\//, "");
  return `${DOCS_URL.replace(/\/$/, "")}/${clean}/`;
}

/** Resolve URL absoluta da documentação para a rota atual, ou null se não houver doc. */
export function resolvePageDocsUrl(pathname: string, search = ""): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Prefere o match mais específico (regex source mais longa).
  const ranked = [...PAGE_DOCS].sort((a, b) => b.match.source.length - a.match.source.length);

  for (const entry of ranked) {
    if (!entry.match.test(normalized)) continue;
    const path =
      typeof entry.path === "function" ? entry.path(normalized, search) : entry.path;
    if (!path) continue;
    return docsPathToUrl(path);
  }

  return null;
}

export function hasPageDocs(pathname: string, search = ""): boolean {
  return resolvePageDocsUrl(pathname, search) != null;
}
