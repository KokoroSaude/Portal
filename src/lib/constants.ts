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
  behavioralProfile: "behavioral.profile",
  aiCopilot: "ai.copilot",
  satisfactionCsat: "satisfaction.csat",
  whatsappConversations: "whatsapp.conversations",
  whatsappVoice: "whatsapp.voice",
  whatsappPrescription: "whatsapp.prescription",
  pharmacyPickup: "pharmacy.pickup",
} as const;

export const TENANT_OPERATION_MODE_LABELS: Record<string, string> = {
  AdherenceProgram: "Programa de adesão",
  GovPharmacy: "Farmácia governamental (SUS)",
};

export const TENANT_PLAN_OPTIONS = [
  { id: "00000000-0000-0000-0001-000000000001", key: "essential", label: "Essential" },
  { id: "00000000-0000-0000-0001-000000000002", key: "professional", label: "Professional" },
  { id: "00000000-0000-0000-0001-000000000003", key: "enterprise", label: "Enterprise" },
] as const;

export const CLINICAL_PRIORITY_TIER_LABELS: Record<string, string> = {
  Normal: "Normal",
  Elderly: "Idoso",
  Pregnant: "Gestante",
  ChronicCritical: "Crônico crítico",
};

export const PICKUP_ORDER_STATUS_LABELS: Record<string, string> = {
  Allocated: "Alocado",
  AwaitingPickup: "Aguardando retirada",
  PatientArrived: "No balcão",
  Completed: "Concluído",
  Cancelled: "Cancelado",
  Expired: "Expirado",
};

export const DELEGATE_RELATIONSHIP_LABELS: Record<string, string> = {
  Filho: "Filho(a)",
  Cuidador: "Cuidador",
  Conjuge: "Cônjuge",
  Irmao: "Irmão(ã)",
  Outro: "Outro",
};

export const PICKUP_NOTIFICATION_ROUTING_LABELS: Record<string, string> = {
  Patient: "Paciente",
  Delegate: "Rede de cuidado",
  Both: "Paciente e rede",
};

export const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Operator: "Operador",
  Viewer: "Visualizador",
};

export const WHATSAPP_ACTIVATION_STATUS = {
  NoSender: 0,
  AwaitingOtp: 1,
  Provisioning: 2,
  WaitingTemplates: 3,
  Ready: 4,
  TrialActive: 5,
  TrialExpired: 6,
} as const;

export const WHATSAPP_ACTIVATION_STATUS_LABELS: Record<number, string> = {
  0: "Sem número",
  1: "Aguardando código",
  2: "Configurando…",
  3: "Sincronizando templates",
  4: "Pronto",
  5: "Trial ativo",
  6: "Trial expirado",
};

export const WHATSAPP_SENDER_PURPOSE_LABELS: Record<number, string> = {
  0: "Geral",
  1: "Adesão",
  2: "Promoções",
  3: "Adesão e promoções",
};

export const WHATSAPP_MODE_LABELS: Record<number, string> = {
  0: "Trial (número Kokoro)",
  1: "Produção (número próprio)",
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
  PrescriptionReview: "Revisão de receita",
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

export const BEHAVIORAL_DIMENSION_LABELS: Record<string, string> = {
  lifestyle: "Estilo de vida",
  habits: "Hábitos",
  emotions: "Emoções",
  cognitive_bias: "Vieses cognitivos",
  comorbidity: "Comorbidades",
  Lifestyle: "Estilo de vida",
  Habits: "Hábitos",
  Emotions: "Emoções",
  CognitiveBias: "Vieses cognitivos",
  Comorbidity: "Comorbidades",
};

export const BEHAVIORAL_SOURCE_LABELS: Record<string, string> = {
  strategic_assessment: "Avaliação estratégica",
  tpb: "TCP (WhatsApp)",
  morisky: "MMAS-8",
};
