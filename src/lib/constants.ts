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
  reportsConversationQuality: "reports.conversation_quality",
  reportsRetentionChurn: "reports.retention_churn",
  reportsOnboardingFunnel: "reports.onboarding_funnel",
  reportsHandoffs: "reports.handoffs",
  reportsExportAdvanced: "reports.export.advanced",
  reportsPdf: "reports.pdf",
  usersManage: "users.manage",
  whatsappSendersManage: "whatsapp.senders.manage",
  scalesMorisky: "scales.morisky",
  scalesTpb: "scales.tpb",
  behavioralProfile: "behavioral.profile",
  aiCopilot: "ai.copilot",
  satisfactionCsat: "satisfaction.csat",
  engagementReminders: "engagement.reminders",
  engagementMilestones: "engagement.milestones",
  whatsappConversations: "whatsapp.conversations",
  whatsappVoice: "whatsapp.voice",
  whatsappPrescription: "whatsapp.prescription",
  pharmacyPickup: "pharmacy.pickup",
  pspPrograms: "psp.programs",
  populationHealthReports: "reports.population_health",
} as const;

export const TENANT_OPERATION_MODE_LABELS: Record<string, string> = {
  AdherenceProgram: "Programa de adesão",
  GovPharmacy: "Farmácia governamental (SUS)",
};

export const TENANT_SEGMENT_LABELS: Record<string, string> = {
  RetailPharmacy: "Varejo farmacêutico",
  PharmaIndustry: "Indústria farmacêutica",
  HealthPlan: "Operadora de saúde",
  PublicHealth: "Saúde pública",
};

/** Perfil GTM sugerido — não restringe módulos; a equipe escolhe o que habilitar. */
export const TENANT_SEGMENT_DESCRIPTIONS: Record<string, string> = {
  RetailPharmacy:
    "Farmácias de rua, redes e drogarias. Foco típico: adesão via WhatsApp, lembretes e relacionamento no balcão. Pode habilitar retirada em farmácia, rede de cuidado ou gestão populacional se fizer sentido para o negócio.",
  PharmaIndustry:
    "Laboratórios e indústria farmacêutica. Foco típico: programas de suporte ao paciente (PSP) e adesão em tratamentos de alto valor. Todos os módulos ficam disponíveis conforme o contrato.",
  HealthPlan:
    "Operadoras e administradoras de benefícios. Foco típico: gestão populacional, indicadores agregados e adesão em carteira. Módulos extras (retirada, PSP, rede) podem ser ligados quando aplicável.",
  PublicHealth:
    "Prefeituras, secretarias de saúde e farmácias populares/SUS. Foco típico: retirada de medicamentos, fila, CNES e rede de cuidado. Outros módulos permanecem opcionais.",
};

export const TENANT_MODULE_LABELS: Record<string, string> = {
  Adherence: "Adesão",
  PharmacyPickup: "Retirada em farmácia",
  CareNetwork: "Rede de cuidado",
  PatientSupportProgram: "Programa de suporte (PSP)",
  PopulationHealth: "Gestão populacional",
};

export const TENANT_MODULE_DESCRIPTIONS: Record<string, string> = {
  Adherence: "Lembretes WhatsApp, check-in e onboarding — obrigatório",
  PharmacyPickup: "Fila de retirada, painel TV, integração ERP e regras SUS",
  CareNetwork: "Delegados (família/cuidador) nos avisos e apoio",
  PatientSupportProgram: "Programas terapêuticos da indústria (PSP)",
  PopulationHealth: "Relatórios populacionais, painel ODS 3 e unidades CNES",
};

export const TPB_CONSTRUCT_DESCRIPTIONS = {
  attitude: {
    title: "Atitude",
    body: "Crença sobre os benefícios e importância de seguir o tratamento.",
  },
  subjective_norm: {
    title: "Normas subjetivas",
    body: "Pressão percebida de médicos, família e pessoas importantes.",
  },
  perceived_control: {
    title: "Controle percebido",
    body: "Confiança de conseguir tomar o medicamento mesmo com obstáculos.",
  },
  intention: {
    title: "Intenção",
    body: "Compromisso declarado de aderir ao tratamento nos próximos dias.",
  },
} as const;

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
  1: "Adesão medicamentosa",
  2: "Promoções e campanhas",
  3: "Adesão e promoções",
};

export const WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS: Record<number, string> = {
  0: "Lembretes, check-ins e jornada do paciente",
  1: "Lembretes, check-ins e jornada do paciente",
  2: "Campanhas em massa com template Meta de marketing",
  3: "Um único número para adesão e promoções",
};

export const WHATSAPP_SENDER_PURPOSE_OPTIONS = [
  { value: 1, label: "Adesão medicamentosa", description: WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS[1] },
  { value: 2, label: "Promoções e campanhas", description: WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS[2] },
  { value: 3, label: "Adesão e promoções (mesmo número)", description: WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS[3] },
] as const;

export function whatsAppSenderPurposeLabel(purpose: number | undefined): string {
  return WHATSAPP_SENDER_PURPOSE_LABELS[purpose ?? 1] ?? WHATSAPP_SENDER_PURPOSE_LABELS[1];
}

export function whatsAppSenderPurposeDescription(purpose: number | undefined): string {
  return WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS[purpose ?? 1] ?? WHATSAPP_SENDER_PURPOSE_DESCRIPTIONS[1];
}

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
