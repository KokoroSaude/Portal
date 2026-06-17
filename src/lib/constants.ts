export const FEATURE_KEYS = {
  templatesCustomRead: "templates.custom.read",
  templatesCustomWrite: "templates.custom.write",
  templatesCustomReset: "templates.custom.reset",
  journeyOnboardingRead: "journey.onboarding.read",
  journeyOnboardingWrite: "journey.onboarding.write",
  reportsBasic: "reports.basic",
  reportsAdvanced: "reports.advanced",
  reportsCharts: "reports.charts",
  reportsCohort: "reports.cohort",
  reportsOperations: "reports.operations",
  reportsBySender: "reports.by_sender",
  reportsExportAdvanced: "reports.export.advanced",
  reportsPdf: "reports.pdf",
  usersManage: "users.manage",
  whatsappSendersManage: "whatsapp.senders.manage",
  scalesMorisky: "scales.morisky",
  scalesTpb: "scales.tpb",
  aiCopilot: "ai.copilot",
  satisfactionCsat: "satisfaction.csat",
  whatsappConversations: "whatsapp.conversations",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Operator: "Operador",
  Viewer: "Visualizador",
};

export const PATIENT_STATUS_LABELS: Record<string, string> = {
  Onboarding: "Onboarding",
  Active: "Ativo",
  Paused: "Pausado",
  Reengagement: "Reengajamento",
  Inactive: "Inativo",
  OptedOut: "Opt-out",
};

export const CONVERSATION_STEP_LABELS: Record<string, string> = {
  None: "Sem fluxo ativo",
  OnboardingFlow: "Cadastro em andamento",
  WaitingCheckin: "Aguardando check-in",
  WaitingReengagement: "Aguardando resposta de reengajamento",
  WaitingPauseResume: "Pausa acabou — aguardando retomar",
  Active: "Ativo (mensagens livres)",
};

export const CONTENT_SOURCE_LABELS: Record<string, string> = {
  patient: "Paciente",
  template: "Template",
  rules: "Regras",
  ai: "IA",
  system: "Sistema",
  operator: "Farmácia",
};

export const VOICE_TONES = ["Acolhedor", "Motivacional", "Direto"] as const;

export const LOCALE_LABELS: Record<string, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English (US)",
  "es-MX": "Español (México)",
};

export const JOURNEY_STEP_TYPE_LABELS: Record<string, string> = {
  welcome_consent: "Boas-vindas + consentimento",
  message: "Mensagem customizada",
  collect_name: "Coletar nome",
  collect_medication: "Coletar medicamento",
  collect_schedule: "Coletar horários",
  confirm_care_plan: "Confirmar plano",
  ask_another_medication: "Perguntar outro medicamento",
};

export const JOURNEY_BUILTIN_IDS = [
  "welcome_consent",
  "collect_name",
  "collect_medication",
  "collect_schedule",
  "confirm_care_plan",
  "ask_another_medication",
] as const;

export const MORISKY_LEVEL_LABELS: Record<string, string> = {
  high: "Alta adesão",
  medium: "Adesão média",
  low: "Baixa adesão",
};

export const MORISKY_TRIGGER_LABELS: Record<string, string> = {
  Onboarding: "Onboarding",
  Periodic: "Periódica",
  AdherenceDrop: "Queda de adesão",
  Manual: "Manual",
};

export const TPB_CONSTRUCT_LABELS: Record<string, string> = {
  Attitude: "Atitude",
  SubjectiveNorm: "Norma subjetiva",
  PerceivedControl: "Controle percebido",
  Intention: "Intenção",
  attitude: "Atitude",
  subjective_norm: "Norma subjetiva",
  perceived_control: "Controle percebido",
  intention: "Intenção",
  norm: "Norma subjetiva",
  control: "Controle percebido",
};

export const TPB_TRIGGER_LABELS: Record<string, string> = {
  Onboarding: "Onboarding",
  Periodic: "Periódica",
  AdherenceDrop: "Queda de adesão",
  Manual: "Manual",
};

export const TPB_RISK_LABELS: Record<string, string> = {
  Alto: "Alto",
  Médio: "Médio",
  Baixo: "Baixo",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};
