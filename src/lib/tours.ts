import { FEATURE_KEYS } from "@/lib/constants";

export type TourStep = {
  id: string;
  /** Seletor CSS, ex: [data-tour="nav-pacientes"] */
  target: string;
  title: string;
  subtitle?: string;
  description: string;
  feature?: string;
  /** Navega antes de exibir o passo */
  route?: string;
  /** Abre menu mobile antes de exibir (sidebar) */
  openMobileNav?: boolean;
};

export type ProductTourDefinition = {
  audience: "platform" | "tenant";
  title: string;
  steps: TourStep[];
};

export const TENANT_TOUR: ProductTourDefinition = {
  audience: "tenant",
  title: "Primeiros passos no Portal",
  steps: [
    {
      id: "nav",
      target: '[data-tour="sidebar-nav"]',
      title: "Primeiros passos no Portal",
      subtitle: "Configuração rápida para começar a operar com confiança.",
      description:
        "Use o menu lateral para alternar entre Dashboard, pacientes, relatórios e demais áreas da operação.",
      openMobileNav: true,
    },
    {
      id: "patients",
      target: '[data-tour="nav-pacientes"]',
      title: "Pacientes",
      subtitle: "Cadastro e acompanhamento.",
      description:
        "Liste, busque e abra a ficha de cada paciente. É por aqui que você acompanha adesão e timeline de mensagens.",
      route: "/pacientes",
      openMobileNav: true,
    },
    {
      id: "whatsapp",
      target: '[data-tour="nav-whatsapp"]',
      title: "WhatsApp",
      subtitle: "Conexão com a Meta.",
      description:
        "Vincule o número Business para enviar lembretes. Sem essa etapa, os pacientes não recebem mensagens automáticas.",
      route: "/whatsapp/configuracao",
      openMobileNav: true,
    },
    {
      id: "content",
      target: '[data-tour="main-content"]',
      title: "Área principal",
      subtitle: "Métricas e ações do dia.",
      description:
        "Aqui aparecem dashboard, formulários e detalhes. O conteúdo muda conforme o item selecionado no menu.",
      route: "/",
    },
    {
      id: "guide",
      target: '[data-tour="nav-guia"]',
      title: "Guia passo a passo",
      subtitle: "Referência sempre disponível.",
      description:
        "Volte a este guia ou reinicie o tour quando precisar. Você encontra também o guia escrito completo em /guia.",
      openMobileNav: true,
    },
  ],
};

export const PLATFORM_TOUR: ProductTourDefinition = {
  audience: "platform",
  title: "Primeiros passos no Superadmin",
  steps: [
    {
      id: "nav",
      target: '[data-tour="sidebar-nav"]',
      title: "Primeiros passos no Superadmin",
      subtitle: "Visão rápida da plataforma Kokoro.",
      description:
        "O menu lateral concentra organizações, mensagens globais e ferramentas de teste. Comece por aqui.",
      openMobileNav: true,
    },
    {
      id: "tenants",
      target: '[data-tour="nav-admin-tenants"]',
      title: "Organizações",
      subtitle: "Organizações na plataforma.",
      description:
        "Gerencie farmácias e clínicas e use impersonação para suporte sem trocar de login.",
      route: "/admin/tenants",
      openMobileNav: true,
    },
    {
      id: "onboarding",
      target: '[data-tour="nav-admin-onboarding"]',
      title: "Onboarding WhatsApp",
      subtitle: "Cadastro do paciente novo.",
      description:
        "Edite o fluxo passo a passo que o paciente percorre no WhatsApp ao entrar no programa — separado dos lembretes do dia a dia.",
      route: "/admin/onboarding",
      openMobileNav: true,
    },
    {
      id: "messages",
      target: '[data-tour="nav-admin-mensagens"]',
      title: "Mensagens operacionais",
      subtitle: "Lembretes e follow-up.",
      description:
        "Edite lembretes, reengajamento e textos custom.* por tom de voz. O onboarding tem área própria no menu.",
      route: "/admin/mensagens",
      openMobileNav: true,
    },
    {
      id: "simulator",
      target: '[data-tour="nav-admin-simulador"]',
      title: "Simulador WhatsApp",
      subtitle: "Teste sem Meta nem Worker.",
      description:
        "Inicie uma conversa e responda como paciente para validar o onboarding, ou teste lembretes com paciente já ativo.",
      route: "/admin/simulador",
      openMobileNav: true,
    },
  ],
};

export function getTourForAudience(isPlatform: boolean): ProductTourDefinition {
  return isPlatform ? PLATFORM_TOUR : TENANT_TOUR;
}

export function filterTourSteps(
  tour: ProductTourDefinition,
  hasFeature: (key: string) => boolean,
): TourStep[] {
  return tour.steps.filter((step) => !step.feature || hasFeature(step.feature));
}

export function tourNavId(path: string): string {
  const slug = path.replace(/^\//, "").replace(/\//g, "-");
  return slug ? `nav-${slug}` : "nav-home";
}

export const TOUR_STORAGE_VERSION = "v1";

export function tourStorageKey(audience: "platform" | "tenant"): string {
  return `kokoro.tour.${TOUR_STORAGE_VERSION}.${audience}`;
}

/** Passos extras para recursos avançados do tenant */
export const TENANT_TOUR_OPTIONAL: TourStep[] = [
  {
    id: "journey",
    target: '[data-tour="nav-jornada"]',
    title: "Jornada de onboarding",
    subtitle: "Fluxo WhatsApp configurável.",
    description: "Ordene e personalize os passos que novos pacientes percorrem ao entrar no programa.",
    feature: FEATURE_KEYS.journeyOnboardingRead,
    route: "/jornada",
    openMobileNav: true,
  },
  {
    id: "templates",
    target: '[data-tour="nav-templates"]',
    title: "Templates",
    subtitle: "Mensagens da sua organização.",
    description: "Sobrescreva textos automáticos só da sua organização, mantendo o padrão global quando não editar.",
    feature: FEATURE_KEYS.templatesCustomRead,
    route: "/templates",
    openMobileNav: true,
  },
  {
    id: "farmacia",
    target: '[data-tour="nav-farmacia"]',
    title: "Farmácia",
    subtitle: "Retirada de medicamentos.",
    description:
      "Painel operacional, fila do dia, fila crônica e relatórios de comparecimento — para farmácias no modo SUS.",
    feature: FEATURE_KEYS.pharmacyPickup,
    route: "/farmacia",
    openMobileNav: true,
  },
];
