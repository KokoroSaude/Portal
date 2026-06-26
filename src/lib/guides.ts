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
  subtitle: "Passo a passo para configurar a plataforma Kokoro, atender organizações e validar mensagens no WhatsApp.",
  sections: [
    {
      id: "overview",
      title: "1. Visão geral",
      description: "Entenda o estado da plataforma antes de alterar organizações.",
      steps: [
        {
          id: "home",
          title: "Painel inicial",
          description:
            "Na visão geral você vê quantas organizações estão ativas e a lista dos cadastros mais recentes.",
          to: "/",
          tips: ["Use como ponto de partida após o login."],
        },
      ],
    },
    {
      id: "tenants",
      title: "2. Organizações",
      description: "Organizações (farmácias/clínicas) que usam o Kokoro no dia a dia.",
      steps: [
        {
          id: "tenants-list",
          title: "Listar organizações",
          description: "Veja organizações cadastradas, status e toggle de IA.",
          to: "/admin/tenants",
        },
        {
          id: "impersonate",
          title: "Entrar como organização",
          description:
            "Acesse o portal como a organização para reproduzir problemas ou ajudar na configuração. Um banner laranja indica o modo de visualização.",
          to: "/admin/tenants",
          tips: ["Saia da impersonação pelo banner no topo da tela."],
        },
      ],
    },
    {
      id: "messages",
      title: "3. Mensagens",
      description: "Onboarding de pacientes e textos do dia a dia.",
      steps: [
        {
          id: "onboarding-messages",
          title: "Onboarding WhatsApp",
          description:
            "Edite o fluxo de cadastro do paciente novo: boas-vindas, perguntas e confirmação — passo a passo, por tom de voz.",
          to: "/admin/onboarding",
          tips: ["Valide com um paciente de teste no WhatsApp após salvar cada passo."],
        },
        {
          id: "default-messages",
          title: "Mensagens operacionais",
          description:
            "Lembretes, follow-up, reengajamento e mensagens custom.* fora do cadastro inicial.",
          to: "/admin/mensagens",
          tips: [
            "Use Nova mensagem para chaves custom.* usadas na jornada da organização.",
            "Restaurar padrão remove overrides salvos no banco.",
          ],
        },
      ],
    },
    {
      id: "platform-config",
      title: "4. Configuração da plataforma",
      description: "Preferências globais que afetam todas as organizações.",
      steps: [
        {
          id: "ai-provider",
          title: "Inteligência artificial",
          description:
            "Cadastre as chaves Anthropic/OpenAI e escolha o provedor ativo — tudo salvo no banco, sem redeploy.",
          to: "/admin/configuracao",
          tips: ["Ative a IA também no tenant em Configurações → Operacional."],
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
          title: "Configurações da organização",
          description:
            "Defina tom de voz padrão, idioma, janela de envio e preferências de IA.",
          to: "/configuracoes",
        },
        {
          id: "whatsapp",
          title: "Conectar WhatsApp",
          description:
            "Vincule o número da Meta (Business) para enviar lembretes. Sem isso, pacientes não recebem mensagens.",
          to: "/whatsapp/configuracao",
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
          description:
            "Cadastre manualmente ou aguarde a primeira mensagem no WhatsApp — o sistema cria o paciente automaticamente.",
          to: "/pacientes",
        },
        {
          id: "patient-detail",
          title: "Ficha do paciente",
          description:
            "Veja timeline, plano de medicamentos e ações como pausar ou corrigir o telefone WhatsApp.",
          to: "/pacientes",
          tips: [
            "Novos pacientes entram em onboarding até concluir o fluxo no WhatsApp.",
            "Se o paciente trocou de número, atualize o telefone na ficha.",
            "Use Enviar mensagem na ficha para abrir a conversa deste paciente.",
          ],
        },
        {
          id: "patient-messages",
          title: "Responder pacientes no WhatsApp",
          description:
            "Em Conversas com pacientes você vê o histórico real e pode responder manualmente como farmácia dentro da janela de 24h.",
          to: "/whatsapp/conversas",
          tips: [
            "Operadores enviam mensagens; perfis somente leitura apenas visualizam.",
            "Fora da janela de 24h, use o envio via template Meta quando disponível.",
          ],
        },
      ],
    },
    {
      id: "customize",
      title: "3. Personalização",
      description: "Ajuste mensagens e fluxo de onboarding do seu programa.",
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
          title: "Templates da organização",
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
    {
      id: "farmacia",
      title: "5. Farmácia (SUS)",
      description: "Retirada de medicamentos, fila crônica e relatórios operacionais.",
      steps: [
        {
          id: "farmacia-dashboard",
          title: "Painel da farmácia",
          description: "Visão do dia: lotes, fila de retirada e alertas de estoque.",
          to: "/farmacia",
          feature: FEATURE_KEYS.pharmacyPickup,
        },
        {
          id: "farmacia-retiradas",
          title: "Retiradas do dia",
          description: "Registre chegada, conclusão, reagendamento e cancelamento na fila operacional.",
          to: "/farmacia/retiradas",
          feature: FEATURE_KEYS.pharmacyPickup,
        },
        {
          id: "farmacia-relatorios",
          title: "Relatórios de retirada",
          description: "Comparecimento, funil operacional, previsão de demanda e exportação de compras.",
          to: "/farmacia/relatorios",
          feature: FEATURE_KEYS.pharmacyPickup,
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
