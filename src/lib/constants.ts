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
  usersManage: "users.manage",
  whatsappSendersManage: "whatsapp.senders.manage",
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
};

export const JOURNEY_BUILTIN_IDS = [
  "welcome_consent",
  "collect_name",
  "collect_medication",
  "collect_schedule",
  "confirm_care_plan",
] as const;
