import { FEATURE_KEYS } from "@/lib/constants";

export type GuideStep = {
  id: string;
  title: string;
  description: string;
  to: string;
  feature?: string;
  tips?: string[];
};

export type GuideSection = {
  id: string;
  title: string;
  description?: string;
  steps: GuideStep[];
};

export type PortalGuide = {
  audience: "platform" | "tenant";
  title: string;
  subtitle: string;
  sections: GuideSection[];
};

export const PLATFORM_GUIDE: PortalGuide = {
  audience: "platform",
  title: "Guia do superadmin",
  subtitle: "Passo a passo para configurar a plataforma Kokoro, atender tenants e validar mensagens no WhatsApp.",
  sections: [
    {
      id: "overview",
      title: "1. Visão geral",
      description: "Entenda o estado da plataforma antes de alterar planos ou tenants.",
      steps: [
        {
          id: "home",
          title: "Painel inicial",
          description:
            "Na visão geral você vê quantos planos e tenants estão ativos e a lista dos clientes mais recentes.",
          to: "/",
          tips: ["Use como ponto de partida após o login."],
        },
      ],
    },
    {
      id: "plans",
      title: "2. Planos e features",
      description: "Defina o que cada plano comercial pode acessar no portal e na API.",
      steps: [
        {
          id: "plans",
          title: "Gerenciar planos",
          description:
            "Crie ou edite planos (Freemium, Premium, Enterprise). Cada tenant fica vinculado a um plano.",
          to: "/admin/planos",
          tips: ["Ordene os planos pelo campo sort order.", "Desative planos que não devem mais ser vendidos."],
        },
        {
          id: "plan-features",
          title: "Features por plano",
          description:
            "Abra um plano e ligue/desligue features como relatórios, templates customizados e jornada de onboarding.",
          to: "/admin/planos",
          tips: ["Mudanças afetam todos os tenants daquele plano."],
        },
        {
          id: "features-catalog",
          title: "Catálogo de features",
          description: "Consulte todas as chaves de feature disponíveis na plataforma.",
          to: "/admin/features",
        },
      ],
    },
    {
      id: "tenants",
      title: "3. Tenants",
      description: "Organizações (farmácias/clínicas) que usam o Kokoro no dia a dia.",
      steps: [
        {
          id: "tenants-list",
          title: "Listar e alterar plano",
          description: "Veja tenants cadastrados, status e plano atual. Atribua outro plano quando necessário.",
          to: "/admin/tenants",
        },
        {
          id: "impersonate",
          title: "Impersonar tenant",
          description:
            "Entre como o tenant para reproduzir problemas ou ajudar na configuração. Um banner laranja indica impersonação.",
          to: "/admin/tenants",
          tips: ["Saia da impersonação pelo banner no topo da tela."],
        },
      ],
    },
    {
      id: "messages",
      title: "4. Mensagens e simulador",
      description: "Onboarding de pacientes, textos do dia a dia e ambiente seguro para testar fluxos.",
      steps: [
        {
          id: "onboarding-messages",
          title: "Onboarding WhatsApp",
          description:
            "Edite o fluxo de cadastro do paciente novo: boas-vindas, perguntas e confirmação — passo a passo, por tom de voz.",
          to: "/admin/onboarding",
          tips: ["Valide no simulador após salvar cada passo."],
        },
        {
          id: "default-messages",
          title: "Mensagens operacionais",
          description:
            "Lembretes, follow-up, reengajamento e mensagens custom.* fora do cadastro inicial.",
          to: "/admin/mensagens",
          tips: [
            "Use Nova mensagem para chaves custom.* usadas na jornada do tenant.",
            "Restaurar padrão remove overrides salvos no banco.",
          ],
        },
        {
          id: "simulator",
          title: "Simulador WhatsApp",
          description:
            "Inicie uma conversa vazia e percorra o onboarding respondendo como paciente, ou crie um paciente ativo para testar lembretes.",
          to: "/admin/simulador",
          tips: ["Modo onboarding: só escolha o tom de voz e responda no chat."],
        },
      ],
    },
    {
      id: "team",
      title: "5. Equipe e marca",
      steps: [
        {
          id: "platform-users",
          title: "Superadmins",
          description: "Cadastre outros usuários com acesso total à plataforma.",
          to: "/admin/usuarios",
        },
        {
          id: "email-signature",
          title: "Assinatura de e-mail",
          description: "Monte e exporte assinatura JPG com logo Kokoro para a equipe comercial.",
          to: "/admin/assinatura",
        },
      ],
    },
  ],
};

export const TENANT_GUIDE: PortalGuide = {
  audience: "tenant",
  title: "Guia da operação",
  subtitle: "Passo a passo para colocar pacientes no programa, conectar o WhatsApp e acompanhar adesão.",
  sections: [
    {
      id: "start",
      title: "1. Primeiros passos",
      description: "Configure a base antes de cadastrar pacientes.",
      steps: [
        {
          id: "settings",
          title: "Configurações do tenant",
          description:
            "Defina nome da organização, tom de voz padrão, idioma e fuso. Confira qual plano e features você possui.",
          to: "/configuracoes",
        },
        {
          id: "whatsapp",
          title: "Conectar WhatsApp",
          description:
            "Vincule o número da Meta (Business) para enviar lembretes. Sem isso, pacientes não recebem mensagens.",
          to: "/whatsapp",
          tips: ["Guarde o token e phone number ID fornecidos pela Meta."],
        },
      ],
    },
    {
      id: "patients",
      title: "2. Pacientes",
      description: "Cadastro e acompanhamento individual.",
      steps: [
        {
          id: "patients-list",
          title: "Lista de pacientes",
          description: "Busque por nome ou telefone, filtre por status e abra o detalhe de cada paciente.",
          to: "/pacientes",
        },
        {
          id: "patient-detail",
          title: "Ficha do paciente",
          description:
            "Veja timeline de mensagens, plano de medicamentos, adesão e ações como pausar ou retomar lembretes.",
          to: "/pacientes",
          tips: ["Novos pacientes entram em onboarding até concluir o fluxo no WhatsApp."],
        },
      ],
    },
    {
      id: "customize",
      title: "3. Personalização",
      description: "Ajuste mensagens e fluxo conforme seu plano.",
      steps: [
        {
          id: "journey",
          title: "Jornada de onboarding",
          description:
            "Ordene os passos que o paciente percorre no WhatsApp ao entrar no programa (nome, medicamento, horários, confirmação).",
          to: "/jornada",
          feature: FEATURE_KEYS.journeyOnboardingRead,
        },
        {
          id: "templates",
          title: "Templates do tenant",
          description:
            "Sobrescreva mensagens automáticas só da sua organização, mantendo o padrão global quando não houver customização.",
          to: "/templates",
          feature: FEATURE_KEYS.templatesCustomRead,
        },
      ],
    },
    {
      id: "metrics",
      title: "4. Métricas",
      steps: [
        {
          id: "dashboard",
          title: "Dashboard",
          description: "Resumo de adesão, check-ins do dia e gráfico por horário.",
          to: "/",
          feature: FEATURE_KEYS.reportsBasic,
        },
        {
          id: "reports",
          title: "Relatórios",
          description: "Análises de adesão, engajamento, operação e comparativos entre períodos.",
          to: "/relatorios",
          feature: FEATURE_KEYS.reportsBasic,
        },
      ],
    },
  ],
};

export function getGuideForAudience(isPlatform: boolean): PortalGuide {
  return isPlatform ? PLATFORM_GUIDE : TENANT_GUIDE;
}

export function filterGuideSections(
  guide: PortalGuide,
  hasFeature: (key: string) => boolean,
): GuideSection[] {
  return guide.sections
    .map((section) => ({
      ...section,
      steps: section.steps.filter((step) => !step.feature || hasFeature(step.feature)),
    }))
    .filter((section) => section.steps.length > 0);
}

export function countGuideSteps(sections: GuideSection[]): number {
  return sections.reduce((n, s) => n + s.steps.length, 0);
}
