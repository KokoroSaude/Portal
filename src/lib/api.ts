import type {
  AdminMetaTemplateItem,
  AdminMetaTemplateList,
  AdminMetaTemplateSubmitResult,
  AdminMessageTemplate,
  AdminOnboardingFlow,
  AdminPlatformUser,
  AdminPlatformAiSettings,
  PlatformAiUseCaseRoute,
  PlatformAiTestResult,
  PromoCampaignDetail,
  PromoCampaignListItem,
  PromoDefaults,
  AdminProductMetrics,
  AdminAdherenceReport,
  AdminEngagementReport,
  AdminOperationsReport,
  AdminPatientAdherenceRank,
  AdminPatientFunnel,
  AdminPeriodComparison,
  AdminMessageVolumeMetrics,
  AdminSatisfactionMetrics,
  AdminOperationalLatencyMetrics,
  AdminAuditLogResult,
  AdminInteractionEventsResult,
  AdminSenderPerformance,
  AdminMoriskyReport,
  AdminTenant,
  AdminDeletedTenant,
  AdminVoiceCatalogEntry,
  AdminVoiceCatalogResponse,
  AdminVoiceWarmResult,
  AdherenceReport,
  CsatBulkTriggerResult,
  CsatManualTriggerResult,
  MoriskyBulkTriggerResult,
  MoriskyManualTriggerResult,
  MilestoneManualTriggerResult,
  MoriskyReport,
  OnboardingBulkTriggerResult,
  OnboardingManualTriggerResult,
  ReminderManualTriggerResult,
  PatientAiBrief,
  PatientAiPrompt,
  PatientAiSuggestions,
  PatientInsightPromptPreview,
  PatientTpbHistory,
  PatientTpbRisk,
  PreviewTpbInterventionResult,
  StrategicAssessmentAnswer,
  StrategicAssessmentDetail,
  StrategicAssessmentScaleViewResponse,
  SubmitStrategicAssessmentResult,
  PatientBehavioralProfile,
  TpbBulkTriggerResult,
  TpbManualTriggerResult,
  TpbReport,
  TpbRiskReport,
  TpbScaleDefinition,
  TpbScaleViewResponse,
  AdherenceTrendPoint,
  CarePlan,
  CarePlanUpsert,
  CreateTenantResponse,
  CreatePatientResponse,
  EngagementReport,
  NudgeEngagementReport,
  ConversationQualityReport,
  MessageContentSourceReport,
  RetentionChurnReport,
  OnboardingStepFunnelReport,
  HandoffReport,
  ConversationIncidentsReport,
  ConversationSimulationResult,
  OperationsReport,
  PatientAdherenceRank,
  PatientFunnel,
  PeriodComparison,
  ReportInsight,
  MedicationCatalogItem,
  MedicationProgramListItem,
  MedicationProgramReport,
  MedicationSuggestion,
  SenderPerformance,
  JourneyStep,
  LoginApiResponse,
  LoginResponse,
  LoginTwoFactorChallengeResponse,
  BeginTwoFactorSetupResponse,
  ConfirmTwoFactorSetupResponse,
  TwoFactorStatus,
  MessageTemplate,
  MoriskyScaleViewResponse,
  OnboardingJourney,
  Patient,
  PatientScheduling,
  PatientStatusChangeResponse,
  PatientMoriskyHistory,
  PatientAchievements,
  PagedResult,
  TenantFeature,
  TenantSettings,
  TenantOperationMode,
  TenantSegment,
  TenantModule,
  TenantSubscription,
  UpsertTemplateResponse,
  KnowledgeDocument,
  TenantUser,
  TimelineEventKind,
  TimelinePagedResult,
  UserInfo,
  UserProfile,
  PlatformUserInfo,
  BehavioralBarriersReport,
  WhatsappDiagnostics,
  WhatsAppSenderPurpose,
  MetaEmbeddedSignupConfig,
  MetaEmbeddedSignupFlowResult,
  WhatsAppActivationStartResult,
  WhatsAppActivationVerifyResult,
  WhatsAppActivationResendResult,
  WhatsAppActivationStatusDto,
  WhatsAppTrialStartResult,
  WhatsAppBusinessProfile,
  UpdateWhatsAppBusinessProfilePayload,
  PickupDashboard,
  PickupInsights,
  PickupTvDisplay,
  PickupAttendanceReport,
  PickupOperationsFunnel,
  PickupDemandForecastItem,
  PickupOperationsReport,
  MedicationWaitlistEntry,
  PickupAnomalyAlert,
  ProcurementSuggestion,
  ProcurementExportRecord,
  PatientCareDelegate,
  UpsertPatientCareDelegatePayload,
  ImportPatientsResult,
  ClinicalPriorityTier,
  ErpCredential,
  GenerateErpCredentialResult,
  ErpConnectionTestResult,
  IntegrationAuditEntry,
  PspProgram,
  PopulationHealthReport,
  PublicHealthDashboard,
} from "@/types/api";
import { API_BASE } from "@/lib/config";
import { normalizeTenantSettings } from "@/lib/normalize-settings";
import { normalizeWhatsappSender, WHATSAPP_SENDER_PURPOSE_TO_API } from "@/lib/normalize-whatsapp-sender";
import { normalizeAdminTenant } from "@/lib/normalize-admin-tenant";
import { normalizeAdminDeletedTenant } from "@/lib/normalize-admin-deleted-tenant";

export function isTwoFactorChallenge(
  res: LoginApiResponse,
): res is LoginTwoFactorChallengeResponse {
  return "requiresTwoFactor" in res && res.requiresTwoFactor === true;
}

export class ApiClientError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

function parseApiErrorMessage(data: unknown, status: number): string {
  const err = data as { error?: string; detail?: string; title?: string } | undefined;
  return err?.error ?? err?.detail ?? err?.title ?? `Erro ${status}`;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const err = data as { code?: string } | undefined;
    if (res.status === 403 && err?.code === "tenant_inactive") {
      window.dispatchEvent(new CustomEvent("kokoro:tenant-inactive"));
    }
    throw new ApiClientError(parseApiErrorMessage(data, res.status), res.status, data);
  }

  return data as T;
}

function qs(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

type RawErpCredential = ErpCredential & {
  Id?: string;
  KeyPrefix?: string;
  IsSandbox?: boolean;
  LastUsedAt?: string | null;
  CreatedAt?: string;
};

type RawGenerateErpCredentialResult = GenerateErpCredentialResult & {
  Id?: string;
  ApiKey?: string;
  KeyPrefix?: string;
  IsSandbox?: boolean;
  CreatedAt?: string;
};

type RawErpConnectionTestResult = ErpConnectionTestResult & {
  Success?: boolean;
  Message?: string | null;
  LatencyMs?: number;
};

type RawIntegrationAuditEntry = IntegrationAuditEntry & {
  Id?: string;
  HttpMethod?: string;
  Path?: string;
  StatusCode?: number;
  CredentialPrefix?: string | null;
  ClientIp?: string | null;
  ExternalReference?: string | null;
  ErrorCode?: string | null;
  DurationMs?: number;
  CreatedAt?: string;
};

function normalizeErpCredential(raw: unknown): ErpCredential {
  const r = raw as RawErpCredential;
  return {
    id: r.id ?? r.Id ?? "",
    keyPrefix: r.keyPrefix ?? r.KeyPrefix ?? "",
    isSandbox: r.isSandbox ?? r.IsSandbox ?? false,
    lastUsedAt: r.lastUsedAt ?? r.LastUsedAt ?? null,
    createdAt: r.createdAt ?? r.CreatedAt ?? "",
  };
}

function normalizeGenerateErpCredentialResult(raw: unknown): GenerateErpCredentialResult {
  const r = raw as RawGenerateErpCredentialResult;
  return {
    id: r.id ?? r.Id ?? "",
    apiKey: r.apiKey ?? r.ApiKey ?? "",
    keyPrefix: r.keyPrefix ?? r.KeyPrefix ?? "",
    isSandbox: r.isSandbox ?? r.IsSandbox ?? false,
    createdAt: r.createdAt ?? r.CreatedAt ?? "",
  };
}

function normalizeErpConnectionTestResult(raw: unknown): ErpConnectionTestResult {
  const r = raw as RawErpConnectionTestResult;
  return {
    success: r.success ?? r.Success ?? false,
    message: r.message ?? r.Message ?? null,
    latencyMs: r.latencyMs ?? r.LatencyMs,
  };
}

function normalizeIntegrationAuditEntry(raw: unknown): IntegrationAuditEntry {
  const r = raw as RawIntegrationAuditEntry;
  return {
    id: r.id ?? r.Id ?? "",
    httpMethod: r.httpMethod ?? r.HttpMethod ?? "",
    path: r.path ?? r.Path ?? "",
    statusCode: r.statusCode ?? r.StatusCode ?? 0,
    credentialPrefix: r.credentialPrefix ?? r.CredentialPrefix ?? null,
    clientIp: r.clientIp ?? r.ClientIp ?? null,
    externalReference: r.externalReference ?? r.ExternalReference ?? null,
    errorCode: r.errorCode ?? r.ErrorCode ?? null,
    durationMs: r.durationMs ?? r.DurationMs ?? 0,
    createdAt: r.createdAt ?? r.CreatedAt ?? "",
  };
}

function adminReportQs(
  params: { from?: string; to?: string; limit?: number; worst?: boolean },
  tenantIds?: string[],
) {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.worst) q.set("worst", "true");
  tenantIds?.forEach((id) => q.append("tenantIds", id));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginApiResponse>("/api/auth/login", { method: "POST", body: { email, password } }),

  verifyTwoFactorLogin: (
    challengeId: string,
    payload: { code?: string; recoveryCode?: string },
  ) =>
    request<LoginResponse>("/api/auth/2fa/verify", {
      method: "POST",
      body: { challengeId, ...payload },
    }),

  getTwoFactorStatus: (token: string) =>
    request<TwoFactorStatus>("/api/auth/2fa/status", { token }),

  beginTwoFactorSetup: (token: string) =>
    request<BeginTwoFactorSetupResponse>("/api/auth/2fa/setup/begin", {
      method: "POST",
      token,
    }),

  confirmTwoFactorSetup: (token: string, code: string) =>
    request<ConfirmTwoFactorSetupResponse>("/api/auth/2fa/setup/confirm", {
      method: "POST",
      token,
      body: { code },
    }),

  disableTwoFactor: (token: string, password: string, code: string) =>
    request<void>("/api/auth/2fa/disable", {
      method: "POST",
      token,
      body: { password, code },
    }),

  regenerateRecoveryCodes: (token: string, password: string, code: string) =>
    request<{ recoveryCodes: string[] }>("/api/auth/2fa/recovery/regenerate", {
      method: "POST",
      token,
      body: { password, code },
    }),

  getTenantTwoFactorStatus: (token: string) =>
    request<TwoFactorStatus>("/api/auth/tenant-2fa/status", { token }),

  beginTenantTwoFactorSetup: (token: string) =>
    request<BeginTwoFactorSetupResponse>("/api/auth/tenant-2fa/setup/begin", {
      method: "POST",
      token,
    }),

  confirmTenantTwoFactorSetup: (token: string, code: string) =>
    request<ConfirmTwoFactorSetupResponse>("/api/auth/tenant-2fa/setup/confirm", {
      method: "POST",
      token,
      body: { code },
    }),

  disableTenantTwoFactor: (token: string, password: string, code: string) =>
    request<void>("/api/auth/tenant-2fa/disable", {
      method: "POST",
      token,
      body: { password, code },
    }),

  refreshToken: (token: string) =>
    request<LoginResponse>("/api/auth/refresh", { method: "POST", token }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<void>("/api/auth/change-password", {
      method: "POST",
      token,
      body: { currentPassword, newPassword },
    }),

  getProfile: (token: string) => request<UserProfile>("/api/auth/me", { token }),

  uploadAvatar: async (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/auth/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      throw new ApiClientError(parseApiErrorMessage(data, res.status), res.status, data);
    }
    return data as UserProfile;
  },

  deleteAvatar: (token: string) =>
    request<UserProfile>("/api/auth/me/avatar", { method: "DELETE", token }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token: string, newPassword: string) =>
    request<void>("/api/auth/reset-password", { method: "POST", body: { token, newPassword } }),

  createTenant: (payload: {
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    const signupKey = import.meta.env.VITE_TENANT_SIGNUP_KEY?.trim();
    return request<CreateTenantResponse>("/api/tenants", {
      method: "POST",
      body: payload,
      headers: signupKey ? { "X-Tenant-Signup-Key": signupKey } : undefined,
    });
  },

  getPatients: (token: string, params: { page?: number; pageSize?: number; status?: string; search?: string }) =>
    request<PagedResult<Patient>>(`/api/patients${qs(params)}`, { token }),

  createPatient: (
    token: string,
    payload: {
      phone: string;
      name?: string;
      cpf?: string;
      sendWelcome?: boolean;
      preferredMessageChannel?: "Text" | "Audio";
      carePlanMedicationIds?: string[];
      senderId?: string;
      senderPhone?: string;
    },
  ) =>
    request<CreatePatientResponse>("/api/patients", { method: "POST", token, body: payload }),

  importPatientsCsv: async (token: string, file: File, sendWelcome = false) => {
    const form = new FormData();
    form.append("file", file);
    if (sendWelcome) form.append("sendWelcome", "true");
    const res = await fetch(`${API_BASE}/api/patients/import`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      const err = data as { error?: string } | undefined;
      throw new ApiClientError(err?.error ?? `Erro ${res.status}`, res.status, data);
    }
    return data as ImportPatientsResult;
  },

  updatePatient: (
    token: string,
    id: string,
    payload: {
      phone?: string;
      name?: string;
      cpf?: string;
      preferredMessageChannel?: string;
      clinicalPriorityTier?: ClinicalPriorityTier | null;
    },
  ) =>
    request<void>(`/api/patients/${id}`, { method: "PUT", token, body: payload }),

  getPatient: (token: string, id: string) =>
    request<Patient>(`/api/patients/${id}`, { token }),

  getPatientTimeline: (
    token: string,
    id: string,
    page = 1,
    pageSize = 20,
    kinds?: TimelineEventKind[],
  ) =>
    request<TimelinePagedResult>(
      `/api/patients/${id}/timeline${qs({
        page,
        pageSize,
        kinds: kinds && kinds.length > 0 ? kinds.join(",") : undefined,
      })}`,
      { token },
    ),

  getPatientScheduling: (token: string, id: string) =>
    request<PatientScheduling>(`/api/patients/${id}/scheduling`, { token }),

  getPatientMorisky: (token: string, patientId: string) =>
    request<PatientMoriskyHistory>(`/api/patients/${patientId}/morisky`, { token }),

  getPatientAchievements: (token: string, patientId: string) =>
    request<PatientAchievements>(`/api/patients/${patientId}/achievements`, { token }),

  triggerPatientMorisky: (token: string, patientId: string) =>
    request<MoriskyManualTriggerResult>(`/api/patients/${patientId}/morisky/trigger`, {
      method: "POST",
      token,
    }),

  triggerMoriskyBulk: (
    token: string,
    payload: { patientIds?: string[]; allActive?: boolean; status?: string },
  ) =>
    request<MoriskyBulkTriggerResult>("/api/morisky/trigger", {
      method: "POST",
      token,
      body: { ignoreCooldown: true, ...payload },
    }),

  triggerPatientCsat: (token: string, patientId: string) =>
    request<CsatManualTriggerResult>(`/api/patients/${patientId}/csat/trigger`, {
      method: "POST",
      token,
    }),

  triggerPatientReminder: (token: string, patientId: string) =>
    request<ReminderManualTriggerResult>(`/api/patients/${patientId}/reminders/trigger`, {
      method: "POST",
      token,
    }),

  triggerPatientMilestone: (token: string, patientId: string, days: 7 | 14 | 30) =>
    request<MilestoneManualTriggerResult>(`/api/patients/${patientId}/milestones/trigger`, {
      method: "POST",
      token,
      body: { days },
    }),

  triggerOnboardingResume: (token: string, patientId: string) =>
    request<OnboardingManualTriggerResult>(`/api/patients/${patientId}/onboarding/resume`, {
      method: "POST",
      token,
    }),

  triggerOnboardingResumeBulk: (
    token: string,
    payload: { patientIds?: string[]; allOnboarding?: boolean; status?: string },
  ) =>
    request<OnboardingBulkTriggerResult>("/api/onboarding/resume/trigger", {
      method: "POST",
      token,
      body: payload,
    }),

  triggerCsatBulk: (
    token: string,
    payload: { patientIds?: string[]; allActive?: boolean; status?: string },
  ) =>
    request<CsatBulkTriggerResult>("/api/csat/trigger", {
      method: "POST",
      token,
      body: { ignoreCooldown: true, ...payload },
    }),

  pausePatient: (token: string, id: string, reason?: string, pauseUntil?: string) =>
    request<PatientStatusChangeResponse>(`/api/patients/${id}/pause`, {
      method: "POST",
      token,
      body: { reason, pauseUntil },
    }),

  resumePatient: (token: string, id: string) =>
    request<PatientStatusChangeResponse>(`/api/patients/${id}/resume`, { method: "POST", token }),

  deletePatient: (token: string, id: string) =>
    request<void>(`/api/patients/${id}`, { method: "DELETE", token }),

  listCarePlans: (token: string, patientId: string) =>
    request<CarePlan[]>(`/api/patients/${patientId}/care-plans`, { token }),

  createCarePlan: (token: string, patientId: string, payload: CarePlanUpsert) =>
    request<{ carePlanId: string }>(`/api/patients/${patientId}/care-plans`, {
      method: "POST",
      token,
      body: payload,
    }),

  updateCarePlanById: (token: string, patientId: string, carePlanId: string, payload: CarePlanUpsert) =>
    request<{ carePlanId: string }>(`/api/patients/${patientId}/care-plans/${carePlanId}`, {
      method: "PATCH",
      token,
      body: payload,
    }),

  deleteCarePlan: (token: string, patientId: string, carePlanId: string) =>
    request<void>(`/api/patients/${patientId}/care-plans/${carePlanId}`, {
      method: "DELETE",
      token,
    }),

  /** @deprecated Use createCarePlan / updateCarePlanById */
  updateCarePlan: (token: string, patientId: string, payload: CarePlanUpsert) =>
    request<{ carePlanId: string }>(`/api/patients/${patientId}/care-plans`, {
      method: "POST",
      token,
      body: payload,
    }),

  getAdherenceReport: (token: string, from?: string, to?: string) =>
    request<AdherenceReport>(`/api/reports/adherence${qs({ from, to })}`, { token }),

  getAdherenceInsights: (token: string, from?: string, to?: string) =>
    request<ReportInsight>(`/api/reports/adherence/insights${qs({ from, to })}`, {
      method: "POST",
      token,
    }),

  getReportInsights: (
    token: string,
    reportKey: string,
    from?: string,
    to?: string,
  ) =>
    request<ReportInsight>(`/api/reports/${reportKey}/insights${qs({ from, to })}`, {
      method: "POST",
      token,
    }),

  getEngagementInsights: (token: string, from?: string, to?: string) =>
    request<ReportInsight>(`/api/reports/engagement/insights${qs({ from, to })}`, {
      method: "POST",
      token,
    }),

  getPatientInsight: (token: string, patientId: string, mode: "auto" | "rules" | "ai" = "auto") =>
    request<ReportInsight>(`/api/patients/${patientId}/insight${qs({ mode: mode === "auto" ? undefined : mode })}`, {
      method: "POST",
      token,
    }),

  getPatientInsightPrompt: (token: string, patientId: string) =>
    request<PatientInsightPromptPreview>(`/api/patients/${patientId}/insight/prompt`, { token }),

  getEngagementReport: (token: string, from?: string, to?: string, patientId?: string) =>
    request<EngagementReport>(`/api/reports/engagement${qs({ from, to, patientId })}`, { token }),

  getNudgeEngagementReport: (token: string, from?: string, to?: string) =>
    request<NudgeEngagementReport>(`/api/reports/nudge-engagement${qs({ from, to })}`, { token }),

  getAdherenceTrend: (token: string, from?: string, to?: string) =>
    request<AdherenceTrendPoint[]>(`/api/reports/adherence/trend${qs({ from, to })}`, { token }),

  getBehavioralBarriersReport: (token: string) =>
    request<BehavioralBarriersReport>("/api/reports/behavioral-barriers", { token }),

  getMoriskyReport: (token: string, from?: string, to?: string) =>
    request<MoriskyReport>(`/api/reports/morisky${qs({ from, to })}`, { token }),

  getPatientFunnel: (token: string) =>
    request<PatientFunnel>("/api/reports/funnel", { token }),

  getPatientRanking: (token: string, from?: string, to?: string, limit = 10, worst = false) =>
    request<PatientAdherenceRank[]>(
      `/api/reports/ranking${qs({ from, to, limit, worst: worst ? "true" : undefined })}`,
      { token },
    ),

  getOperationsReport: (token: string, from?: string, to?: string) =>
    request<OperationsReport>(`/api/reports/operations${qs({ from, to })}`, { token }),

  getSenderPerformance: (token: string, from?: string, to?: string) =>
    request<SenderPerformance[]>(`/api/reports/senders${qs({ from, to })}`, { token }),

  getMedicationProgramReport: (
    token: string,
    params: {
      medication?: string;
      medicationId?: string;
      from?: string;
      to?: string;
      atRiskThreshold?: number;
    },
  ) =>
    request<MedicationProgramReport>(
      `/api/reports/medication-program${qs({
        medication: params.medication,
        medicationId: params.medicationId,
        from: params.from,
        to: params.to,
        atRiskThreshold: params.atRiskThreshold,
      })}`,
      { token },
    ),

  getMedicationSuggestions: (token: string, q?: string, limit = 20) =>
    request<MedicationSuggestion[]>(
      `/api/reports/medication-suggestions${qs({ q, limit })}`,
      { token },
    ),

  listMedications: (token: string) =>
    request<MedicationCatalogItem[]>("/api/medications", { token }),

  createMedication: (
    token: string,
    payload: {
      canonicalName: string;
      dcbCode?: string;
      catmatCode?: string;
      clinicalPriorityBoost?: number;
      aliases?: string[];
    },
  ) =>
    request<{ id: string }>("/api/medications", { method: "POST", token, body: payload }),

  updateMedication: (
    token: string,
    medicationId: string,
    payload: {
      canonicalName?: string;
      dcbCode?: string;
      catmatCode?: string;
      clinicalPriorityBoost?: number;
      isActive?: boolean;
      aliases?: string[];
    },
  ) => request<void>(`/api/medications/${medicationId}`, { method: "PUT", token, body: payload }),

  backfillMedicationIds: (token: string) =>
    request<{ updated: number; unmatched: number }>("/api/medications/backfill", {
      method: "POST",
      token,
    }),

  listMedicationPrograms: (token: string) =>
    request<MedicationProgramListItem[]>("/api/medication-programs", { token }),

  createMedicationProgram: (
    token: string,
    payload: {
      name: string;
      medicationId: string;
      atRiskMissedThreshold?: number;
      targetAdherenceRate?: number;
    },
  ) =>
    request<{ id: string }>("/api/medication-programs", { method: "POST", token, body: payload }),

  updateMedicationProgram: (
    token: string,
    programId: string,
    payload: {
      name?: string;
      isActive?: boolean;
      atRiskMissedThreshold?: number;
      targetAdherenceRate?: number;
    },
  ) =>
    request<void>(`/api/medication-programs/${programId}`, {
      method: "PATCH",
      token,
      body: payload,
    }),

  getMedicationProgramDashboard: (
    token: string,
    programId: string,
    from?: string,
    to?: string,
  ) =>
    request<MedicationProgramReport>(
      `/api/medication-programs/${programId}/dashboard${qs({ from, to })}`,
      { token },
    ),

  getPeriodComparison: (token: string, from?: string, to?: string) =>
    request<PeriodComparison>(`/api/reports/comparison${qs({ from, to })}`, { token }),

  getConversationQualityReport: (token: string, from?: string, to?: string) =>
    request<ConversationQualityReport>(
      `/api/reports/conversation-quality${qs({ from, to })}`,
      { token },
    ),

  getMessageContentSourceReport: (token: string, from?: string, to?: string, patientId?: string) =>
    request<MessageContentSourceReport>(
      `/api/reports/message-content-sources${qs({ from, to, patientId })}`,
      { token },
    ),

  getRetentionChurnReport: (token: string, from?: string, to?: string) =>
    request<RetentionChurnReport>(`/api/reports/retention-churn${qs({ from, to })}`, { token }),

  getOnboardingStepFunnelReport: (token: string, from?: string, to?: string) =>
    request<OnboardingStepFunnelReport>(
      `/api/reports/onboarding-funnel${qs({ from, to })}`,
      { token },
    ),

  getHandoffReport: (token: string, from?: string, to?: string) =>
    request<HandoffReport>(`/api/reports/handoffs${qs({ from, to })}`, { token }),

  getConversationIncidentsReport: (
    token: string,
    from?: string,
    to?: string,
    limit = 50,
    offset = 0,
  ) =>
    request<ConversationIncidentsReport>(
      `/api/reports/conversation-incidents${qs({ from, to, limit, offset })}`,
      { token },
    ),

  exportExitSurveysCsv: async (token: string, from?: string, to?: string) => {
    const res = await fetch(
      `${API_BASE}/api/reports/exit-surveys/export${qs({ from, to })}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new ApiClientError(await res.text(), res.status);
    return res.blob();
  },

  exportConversationIncidentsCsv: async (token: string, from?: string, to?: string) => {
    const res = await fetch(
      `${API_BASE}/api/reports/conversation-incidents/export${qs({ from, to })}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new ApiClientError(await res.text(), res.status);
    return res.blob();
  },

  simulateConversation: (
    token: string,
    payload: {
      patientId: string;
      patientMessage: string;
      openSurfaceKind?: string | null;
      scenario?: string | null;
    },
  ) =>
    request<ConversationSimulationResult>("/api/conversational/simulate", {
      method: "POST",
      token,
      body: payload,
    }),

  getMoriskyScale: (token: string) =>
    request<MoriskyScaleViewResponse>("/api/morisky/scale", { token }),

  getTpbScale: (token: string) =>
    request<TpbScaleViewResponse>("/api/tpb/scale", { token }),

  updateTpbScale: (token: string, scale: TpbScaleDefinition) =>
    request<void>("/api/tpb/scale", { method: "PUT", token, body: scale }),

  resetTpbScale: (token: string) =>
    request<void>("/api/tpb/scale", { method: "DELETE", token }),

  getPatientTpb: (token: string, patientId: string) =>
    request<PatientTpbHistory>(`/api/patients/${patientId}/tpb`, { token }),

  triggerPatientTpb: (token: string, patientId: string) =>
    request<TpbManualTriggerResult>(`/api/patients/${patientId}/tpb/trigger`, {
      method: "POST",
      token,
    }),

  triggerTpbBulk: (
    token: string,
    payload: { patientIds?: string[]; allActive?: boolean; status?: string },
  ) =>
    request<TpbBulkTriggerResult>("/api/tpb/trigger", {
      method: "POST",
      token,
      body: { ignoreCooldown: true, ...payload },
    }),

  previewTpbIntervention: (
    token: string,
    patientId: string,
    templateBase?: string,
  ) =>
    request<PreviewTpbInterventionResult>("/api/tpb/intervention/preview", {
      method: "POST",
      token,
      body: { patientId, templateBase },
    }),

  getPatientTpbRisk: (token: string, patientId: string) =>
    request<PatientTpbRisk>(`/api/patients/${patientId}/tpb-risk`, { token }),

  getStrategicAssessmentScale: async (token: string) => {
    const raw = await request<StrategicAssessmentScaleViewResponse>("/api/patients/behavioral/scale", {
      token,
    });
    return {
      scale: {
        ...raw.scale,
        questions: (raw.scale?.questions ?? []).map((q) => ({
          ...q,
          dimension:
            typeof q.dimension === "number"
              ? ["Lifestyle", "Habits", "Emotions", "CognitiveBias", "Comorbidity"][q.dimension] ??
                String(q.dimension)
              : q.dimension,
        })),
      },
    };
  },

  getPatientStrategicAssessment: async (token: string, patientId: string) => {
    try {
      return await request<StrategicAssessmentDetail>(
        `/api/patients/${patientId}/strategic-assessment`,
        { token },
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) return null;
      throw err;
    }
  },

  submitStrategicAssessment: (
    token: string,
    patientId: string,
    answers: StrategicAssessmentAnswer[],
  ) =>
    request<SubmitStrategicAssessmentResult>(`/api/patients/${patientId}/strategic-assessment`, {
      method: "POST",
      token,
      body: { answers },
    }),

  getPatientBehavioralProfile: (token: string, patientId: string) =>
    request<PatientBehavioralProfile>(`/api/patients/${patientId}/behavioral-profile`, { token }),

  getTpbReport: (token: string, from?: string, to?: string) =>
    request<TpbReport>(`/api/reports/tpb${qs({ from, to })}`, { token }),

  getTpbRiskReport: (token: string) =>
    request<TpbRiskReport>("/api/reports/tpb-risk", { token }),

  listPspPrograms: (token: string) =>
    request<PspProgram[]>("/api/psp/programs", { token }),

  createPspProgram: (
    token: string,
    body: { name: string; medication?: string; brandDisplayName?: string },
  ) =>
    request<{ id: string }>("/api/psp/programs", { method: "POST", token, body }),

  updatePspProgram: (
    token: string,
    programId: string,
    body: { name?: string; medication?: string; brandDisplayName?: string; isActive?: boolean },
  ) =>
    request<void>(`/api/psp/programs/${programId}`, { method: "PUT", token, body }),

  getPopulationHealthReport: (token: string) =>
    request<PopulationHealthReport>("/api/reports/population-health", { token }),

  getPublicHealthDashboard: (token: string) =>
    request<PublicHealthDashboard>("/api/reports/public-health-dashboard", { token }),

  getPatientAiBrief: async (token: string, patientId: string, mode: "auto" | "rules" | "ai" = "auto") => {
    const path = `/api/patients/${patientId}/ai-brief${qs({ mode: mode === "auto" ? undefined : mode })}`;
    try {
      return await request<PatientAiBrief>(path, { method: "POST", token });
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 405) {
        return request<PatientAiBrief>(path, { token });
      }
      throw err;
    }
  },

  getPatientAiSuggestions: (token: string, patientId: string) =>
    request<PatientAiSuggestions>(`/api/patients/${patientId}/ai-suggestions`, {
      method: "POST",
      token,
    }),

  exportPatientsCsv: async (
    token: string,
    status?: string,
    from?: string,
    to?: string,
    medicationId?: string,
    programId?: string,
  ) => {
    const res = await fetch(
      `${API_BASE}/api/reports/patients/export${qs({ status, from, to, medicationId, programId })}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      const text = await res.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        data = undefined;
      }
      throw new ApiClientError(parseApiErrorMessage(data, res.status), res.status, data);
    }
    return res.blob();
  },

  listUsers: (token: string) => request<TenantUser[]>("/api/users", { token }),

  createUser: (token: string, payload: { name: string; email: string; password: string; role: string }) =>
    request<{ id: string }>("/api/users", { method: "POST", token, body: payload }),

  updateUser: (
    token: string,
    userId: string,
    payload: { name?: string; role?: string; isActive?: boolean },
  ) => request<void>(`/api/users/${userId}`, { method: "PUT", token, body: payload }),

  deleteUser: (token: string, userId: string) =>
    request<void>(`/api/users/${userId}`, { method: "DELETE", token }),

  listSenders: async (token: string) => {
    const rows = await request<Parameters<typeof normalizeWhatsappSender>[0][]>(
      "/api/senders",
      { token },
    );
    return (rows ?? []).map(normalizeWhatsappSender);
  },

  createSender: (
    token: string,
    payload: { phoneNumber: string; displayName: string; wabaId: string; phoneId: string },
  ) => request<{ id: string }>("/api/senders", { method: "POST", token, body: payload }),

  updateSender: (
    token: string,
    senderId: string,
    payload: {
      displayName?: string;
      phoneNumber?: string;
      wabaId?: string;
      phoneId?: string;
      isActive?: boolean;
      purpose?: WhatsAppSenderPurpose;
    },
  ) => {
    const body =
      payload.purpose !== undefined
        ? { ...payload, purpose: WHATSAPP_SENDER_PURPOSE_TO_API[payload.purpose] }
        : payload;
    return request<void>(`/api/senders/${senderId}`, { method: "PUT", token, body });
  },

  deleteSender: (token: string, senderId: string) =>
    request<void>(`/api/senders/${senderId}`, { method: "DELETE", token }),

  getWhatsAppActivationStatus: (token: string) =>
    request<WhatsAppActivationStatusDto>("/api/whatsapp/activation/status", { token }),

  startWhatsAppActivation: (
    token: string,
    payload: { phone: string; purpose?: number },
  ) =>
    request<WhatsAppActivationStartResult>("/api/whatsapp/activation/start", {
      method: "POST",
      token,
      body: payload,
    }),

  verifyWhatsAppActivation: (token: string, payload: { sessionId: string; otp: string }) =>
    request<WhatsAppActivationVerifyResult>("/api/whatsapp/activation/verify", {
      method: "POST",
      token,
      body: payload,
    }),

  resendWhatsAppActivation: (
    token: string,
    payload: { sessionId: string; useVoice?: boolean },
  ) =>
    request<WhatsAppActivationResendResult>("/api/whatsapp/activation/resend", {
      method: "POST",
      token,
      body: payload,
    }),

  startWhatsAppTrial: (token: string) =>
    request<WhatsAppTrialStartResult>("/api/whatsapp/activation/trial/start", {
      method: "POST",
      token,
    }),

  getMetaEmbeddedSignupConfig: (token: string) =>
    request<MetaEmbeddedSignupConfig>("/api/meta/embedded-signup/config", {
      token,
    }),

  completeMetaEmbeddedSignup: (
    token: string,
    payload: {
      code?: string;
      wabaId?: string;
      phoneId?: string;
      phoneNumber?: string;
      displayName?: string;
      redirectUri?: string;
      sessionId?: string;
    },
  ) =>
    request<MetaEmbeddedSignupFlowResult>("/api/meta/embedded-signup/complete", {
      method: "POST",
      token,
      body: payload,
    }),

  getWhatsAppBusinessProfile: (token: string, senderId: string) =>
    request<WhatsAppBusinessProfile>(`/api/senders/${senderId}/business-profile`, { token }),

  updateWhatsAppBusinessProfile: (
    token: string,
    senderId: string,
    payload: UpdateWhatsAppBusinessProfilePayload,
  ) =>
    request<WhatsAppBusinessProfile>(`/api/senders/${senderId}/business-profile`, {
      method: "PUT",
      token,
      body: payload,
    }),

  uploadWhatsAppBusinessProfilePicture: async (token: string, senderId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/senders/${senderId}/business-profile/picture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      const err = data as { error?: string } | undefined;
      throw new ApiClientError(err?.error ?? `Erro ${res.status}`, res.status, data);
    }
    return data as WhatsAppBusinessProfile;
  },

  getWhatsAppDiagnostics: (token: string, limit = 50) =>
    request<WhatsappDiagnostics>(`/api/whatsapp/diagnostics?limit=${limit}`, { token }),

  clearWhatsAppDiagnosticEvents: (token: string) =>
    request<void>("/api/whatsapp/diagnostics/events", { method: "DELETE", token }),

  getPromoDefaults: (token: string) =>
    request<PromoDefaults>("/api/promotions/defaults", { token }),

  listPromoCampaigns: (token: string, limit = 20) =>
    request<PromoCampaignListItem[]>(`/api/promotions/campaigns?limit=${limit}`, { token }),

  getPromoCampaign: (token: string, campaignId: string) =>
    request<PromoCampaignDetail>(`/api/promotions/campaigns/${campaignId}`, { token }),

  createPromoCampaign: (
    token: string,
    body: {
      message: string;
      segment?: string;
      segmentMedicationId?: string;
      purchaseUrlSuffix?: string;
      couponCode?: string;
    },
  ) =>
    request<{ campaignId: string; totalRecipients: number }>("/api/promotions/campaigns", {
      method: "POST",
      token,
      body,
    }),

  updatePromoCampaign: (
    token: string,
    campaignId: string,
    body: { message: string; purchaseUrlSuffix?: string; couponCode?: string },
  ) =>
    request<void>(`/api/promotions/campaigns/${campaignId}`, {
      method: "PUT",
      token,
      body,
    }),

  sendPromoCampaign: (token: string, campaignId: string) =>
    request<{ status: string }>(`/api/promotions/campaigns/${campaignId}/send`, {
      method: "POST",
      token,
    }),

  schedulePromoCampaign: (token: string, campaignId: string, scheduledAt: string) =>
    request<{ status: string; scheduledAt: string }>(
      `/api/promotions/campaigns/${campaignId}/schedule`,
      { method: "POST", token, body: { scheduledAt } },
    ),

  cancelScheduledPromoCampaign: (token: string, campaignId: string) =>
    request<{ status: string }>(`/api/promotions/campaigns/${campaignId}/cancel-schedule`, {
      method: "POST",
      token,
    }),

  deactivatePromoCampaign: (token: string, campaignId: string) =>
    request<{ status: string }>(`/api/promotions/campaigns/${campaignId}/deactivate`, {
      method: "POST",
      token,
    }),

  deletePromoCampaign: (token: string, campaignId: string) =>
    request<void>(`/api/promotions/campaigns/${campaignId}`, { method: "DELETE", token }),

  getSettings: async (token: string) =>
    normalizeTenantSettings(await request<TenantSettings>("/api/settings", { token })),

  getPatientAiPrompts: (token: string) =>
    request<PatientAiPrompt[]>("/api/settings/ai/prompts", { token }),

  adminGetPatientAiPrompts: (token: string) =>
    request<PatientAiPrompt[]>("/api/admin/platform/ai/prompts", { token }),

  adminUpdatePatientAiPrompt: (token: string, promptId: string, systemPrompt: string | null) =>
    request<void>(`/api/admin/platform/ai/prompts/${encodeURIComponent(promptId)}`, {
      method: "PUT",
      token,
      body: { systemPrompt },
    }),

  updateSettings: (token: string, payload: Partial<TenantSettings>) =>
    request<void>("/api/settings", { method: "PUT", token, body: payload }),

  listErpCredentials: async (token: string) => {
    const raw = await request<unknown[]>("/api/settings/pickup/erp-credentials", { token });
    return (raw ?? []).map(normalizeErpCredential);
  },

  generateErpCredential: async (token: string, sandbox = false) =>
    normalizeGenerateErpCredentialResult(
      await request<unknown>("/api/settings/pickup/erp-credentials", {
        method: "POST",
        token,
        body: { sandbox },
      }),
    ),

  revokeErpCredential: (token: string, id: string) =>
    request<void>(`/api/settings/pickup/erp-credentials/${id}`, { method: "DELETE", token }),

  testErpConnection: async (token: string) =>
    normalizeErpConnectionTestResult(
      await request<unknown>("/api/settings/pickup/erp-credentials/test", {
        method: "POST",
        token,
      }),
    ),

  listIntegrationAudit: async (token: string, limit = 50) => {
    const raw = await request<unknown[]>(
      `/api/settings/pickup/integration-audit${qs({ limit })}`,
      { token },
    );
    return (raw ?? []).map(normalizeIntegrationAuditEntry);
  },

  getPickupDashboard: (token: string) =>
    request<PickupDashboard>("/api/pickup/dashboard", { token }),

  getPickupStockRiskInsights: (token: string, horizonDays = 7) =>
    request<PickupInsights>(`/api/pickup/insights/stock-risk${qs({ horizonDays })}`, { token }),

  pickupArriveOrder: (token: string, orderId: string, delegateId?: string) =>
    request<{ status: string; queuePassword?: string; outsidePickupWindow?: boolean }>(
      `/api/pickup/orders/${orderId}/arrive`,
      {
        method: "POST",
        token,
        body: { delegateId },
      },
    ),

  pickupRescheduleOrder: (
    token: string,
    orderId: string,
    payload: { expectedPickupDate: string; windowStart?: string; windowEnd?: string },
  ) =>
    request<{ status: string }>(`/api/pickup/orders/${orderId}/reschedule`, {
      method: "PATCH",
      token,
      body: payload,
    }),

  listPickupAnomalies: (token: string, includeDismissed = false) =>
    request<PickupAnomalyAlert[]>(
      `/api/pickup/anomalies${qs({ includeDismissed: includeDismissed ? "true" : undefined })}`,
      { token },
    ),

  dismissPickupAnomaly: (token: string, alertId: string) =>
    request<void>(`/api/pickup/anomalies/${alertId}/dismiss`, { method: "POST", token }),

  getProcurementSuggestions: (token: string, weeks = 4) =>
    request<ProcurementSuggestion[]>(
      `/api/pickup/procurement/suggestions${qs({ weeks })}`,
      { token },
    ),

  exportProcurementCsv: async (token: string, weeks = 4) => {
    const res = await fetch(`${API_BASE}/api/pickup/procurement/export${qs({ weeks })}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new ApiClientError(body || res.statusText, res.status);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const fileName =
      disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? `pedido-sugestao-${weeks}w.csv`;
    return { blob, fileName };
  },

  listProcurementExports: (token: string) =>
    request<ProcurementExportRecord[]>("/api/pickup/procurement/exports", { token }),

  pickupCompleteOrder: (
    token: string,
    orderId: string,
    payload?: { quantity?: number; pickedUpByDelegateId?: string; pickedUpByName?: string },
  ) =>
    request<{ status: string; dispensingId?: string }>(
      `/api/pickup/orders/${orderId}/complete`,
      { method: "POST", token, body: payload ?? {} },
    ),

  pickupCancelOrder: (token: string, orderId: string, reason?: string) =>
    request<{ status: string; reallocated?: boolean }>(`/api/pickup/orders/${orderId}/cancel`, {
      method: "POST",
      token,
      body: { reason },
    }),

  getPickupAttendanceReport: (
    token: string,
    params?: { from?: string; to?: string; groupBy?: string },
  ) =>
    request<PickupAttendanceReport>(
      `/api/pickup/reports/attendance${qs(params ?? {})}`,
      { token },
    ),

  getPickupOperationsFunnel: (token: string, params?: { from?: string; to?: string }) =>
    request<PickupOperationsFunnel>(
      `/api/pickup/reports/operations-funnel${qs(params ?? {})}`,
      { token },
    ),

  getPickupDemandForecast: (token: string, weeks = 4) =>
    request<PickupDemandForecastItem[]>(
      `/api/pickup/reports/demand-forecast${qs({ weeks })}`,
      { token },
    ),

  getPickupOperationsReport: (token: string, params?: { from?: string; to?: string }) =>
    request<PickupOperationsReport>(
      `/api/pickup/reports/operations${qs(params ?? {})}`,
      { token },
    ),

  listMedicationWaitlist: (token: string, medicationId?: string) =>
    request<MedicationWaitlistEntry[]>(
      `/api/pickup/waitlist${qs({ medicationId })}`,
      { token },
    ),

  enrollMedicationWaitlist: (token: string, patientId: string, medicationId: string) =>
    request<MedicationWaitlistEntry>("/api/pickup/waitlist", {
      method: "POST",
      token,
      body: { patientId, medicationId },
    }),

  removeMedicationWaitlist: (token: string, entryId: string) =>
    request<void>(`/api/pickup/waitlist/${entryId}`, { method: "DELETE", token }),

  listPatientCareDelegates: (token: string, patientId: string) =>
    request<PatientCareDelegate[]>(`/api/patients/${patientId}/delegates`, { token }),

  createPatientCareDelegate: (
    token: string,
    patientId: string,
    payload: UpsertPatientCareDelegatePayload,
  ) =>
    request<PatientCareDelegate>(`/api/patients/${patientId}/delegates`, {
      method: "POST",
      token,
      body: payload,
    }),

  updatePatientCareDelegate: (
    token: string,
    patientId: string,
    delegateId: string,
    payload: UpsertPatientCareDelegatePayload,
  ) =>
    request<PatientCareDelegate>(`/api/patients/${patientId}/delegates/${delegateId}`, {
      method: "PUT",
      token,
      body: payload,
    }),

  deletePatientCareDelegate: (token: string, patientId: string, delegateId: string) =>
    request<void>(`/api/patients/${patientId}/delegates/${delegateId}`, {
      method: "DELETE",
      token,
    }),

  getPickupTvDisplay: (tvToken: string) =>
    request<PickupTvDisplay>(`/api/pickup/tv/display${qs({ token: tvToken })}`),

  getSubscription: (token: string) =>
    request<TenantSubscription>("/api/subscription/me", { token }),

  getLocales: () => request<string[]>("/api/subscription/locales"),

  getTemplates: (token: string, tone?: string) =>
    request<MessageTemplate[]>(`/api/templates${qs({ tone })}`, { token }),

  upsertTemplate: (
    token: string,
    key: string,
    content: string,
    description?: string,
    tone?: string,
    voiceContent?: string | null,
  ) =>
    request<UpsertTemplateResponse | void>(`/api/templates/${encodeURIComponent(key)}`, {
      method: "PUT",
      token,
      body: { content, description, tone, voiceContent: voiceContent ?? null },
    }),

  resetTemplate: (token: string, key: string, tone?: string) =>
    request<void>(`/api/templates/${encodeURIComponent(key)}${qs({ tone })}`, { method: "DELETE", token }),

  listKnowledgeDocuments: (token: string) =>
    request<KnowledgeDocument[]>("/api/knowledge", { token }),

  uploadKnowledgeDocument: async (token: string, file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    const res = await fetch(`${API_BASE}/api/knowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    if (!res.ok) {
      const err = data as { error?: string } | undefined;
      throw new ApiClientError(err?.error ?? `Erro ${res.status}`, res.status, data);
    }
    return data as KnowledgeDocument;
  },

  deleteKnowledgeDocument: (token: string, id: string) =>
    request<void>(`/api/knowledge/${id}`, { method: "DELETE", token }),

  getOnboardingJourney: (token: string) =>
    request<OnboardingJourney>("/api/journey/onboarding", { token }),

  updateOnboardingJourney: (token: string, steps: JourneyStep[]) =>
    request<void>("/api/journey/onboarding", { method: "PUT", token, body: { steps } }),

  resetOnboardingJourney: (token: string) =>
    request<void>("/api/journey/onboarding", { method: "DELETE", token }),

  // Admin
  adminListTenants: async (token: string): Promise<AdminTenant[]> => {
    const rows = await request<Parameters<typeof normalizeAdminTenant>[0][]>(
      "/api/admin/tenants",
      { token },
    );
    return rows.map(normalizeAdminTenant);
  },

  adminCreateTenant: (
    token: string,
    payload: {
      name: string;
      slug: string;
      planId?: string;
      tenantSegment?: TenantSegment;
      enabledModules?: TenantModule[];
      tenantOperationMode?: TenantOperationMode;
      adminName: string;
      adminEmail: string;
      adminPassword: string;
      isActive?: boolean;
      aiEnabled?: boolean;
    },
  ) =>
    request<{ tenantId: string; adminUserId: string }>("/api/admin/tenants", {
      method: "POST",
      token,
      body: payload,
    }),

  adminUpdateTenant: (
    token: string,
    tenantId: string,
    payload: {
      name: string;
      slug: string;
      planId: string;
      tenantSegment: TenantSegment;
      enabledModules: TenantModule[];
      isActive: boolean;
      aiEnabled: boolean;
    },
  ) =>
    request<void>(`/api/admin/tenants/${tenantId}`, {
      method: "PUT",
      token,
      body: payload,
    }),

  adminSoftDeleteTenant: (
    token: string,
    tenantId: string,
    confirmSlug: string,
    totpCode: string,
  ) =>
    request<void>(`/api/admin/tenants/${tenantId}/delete`, {
      method: "POST",
      token,
      body: { confirmSlug, totpCode },
    }),

  adminRestoreTenant: (token: string, tenantId: string) =>
    request<void>(`/api/admin/tenants/${tenantId}/restore`, { method: "POST", token }),

  adminPurgeTenant: (
    token: string,
    tenantId: string,
    confirmSlug: string,
    totpCode: string,
  ) =>
    request<void>(`/api/admin/tenants/${tenantId}/purge`, {
      method: "POST",
      token,
      body: { confirmSlug, totpCode },
    }),

  adminListDeletedTenants: async (token: string): Promise<AdminDeletedTenant[]> => {
    const rows = await request<Parameters<typeof normalizeAdminDeletedTenant>[0][]>(
      "/api/admin/tenants/deleted",
      { token },
    );
    return rows.map(normalizeAdminDeletedTenant);
  },

  adminGetAdherenceReport: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminAdherenceReport>(
      `/api/admin/reports/adherence${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetAdherenceTrend: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdherenceTrendPoint[]>(
      `/api/admin/reports/adherence/trend${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetEngagementReport: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminEngagementReport>(
      `/api/admin/reports/engagement${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetPatientFunnel: (token: string, tenantIds?: string[]) =>
    request<AdminPatientFunnel>(
      `/api/admin/reports/funnel${adminReportQs({}, tenantIds)}`,
      { token },
    ),

  adminGetPatientRanking: (
    token: string,
    from?: string,
    to?: string,
    limit = 10,
    worst = false,
    tenantIds?: string[],
  ) =>
    request<AdminPatientAdherenceRank[]>(
      `/api/admin/reports/ranking${adminReportQs({ from, to, limit, worst }, tenantIds)}`,
      { token },
    ),

  adminGetOperationsReport: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminOperationsReport>(
      `/api/admin/reports/operations${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetSenderPerformance: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminSenderPerformance[]>(
      `/api/admin/reports/senders${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetPeriodComparison: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminPeriodComparison>(
      `/api/admin/reports/comparison${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetMessageVolumeMetrics: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminMessageVolumeMetrics>(
      `/api/admin/metrics/messages${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetSatisfactionMetrics: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminSatisfactionMetrics>(
      `/api/admin/metrics/satisfaction${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetOperationalLatencyMetrics: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminOperationalLatencyMetrics>(
      `/api/admin/metrics/operations${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetMoriskyReport: (token: string, from?: string, to?: string, tenantIds?: string[]) =>
    request<AdminMoriskyReport>(
      `/api/admin/reports/morisky${adminReportQs({ from, to }, tenantIds)}`,
      { token },
    ),

  adminGetAuditLog: (
    token: string,
    params: {
      from?: string;
      to?: string;
      tenantIds?: string[];
      patientId?: string;
      userId?: string;
      action?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const q = adminReportQs(
      { from: params.from, to: params.to, limit: params.limit },
      params.tenantIds,
    );
    const url = new URLSearchParams(q.startsWith("?") ? q.slice(1) : q);
    if (params.offset) url.set("offset", String(params.offset));
    if (params.patientId) url.set("patientId", params.patientId);
    if (params.userId) url.set("userId", params.userId);
    if (params.action) url.set("action", params.action);
    const qs = url.toString();
    return request<AdminAuditLogResult>(`/api/admin/audit-log${qs ? `?${qs}` : ""}`, { token });
  },

  adminGetInteractionEvents: (
    token: string,
    params: {
      from?: string;
      to?: string;
      tenantIds?: string[];
      patientId?: string;
      userId?: string;
      eventType?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const q = adminReportQs(
      { from: params.from, to: params.to, limit: params.limit },
      params.tenantIds,
    );
    const url = new URLSearchParams(q.startsWith("?") ? q.slice(1) : q);
    if (params.offset) url.set("offset", String(params.offset));
    if (params.patientId) url.set("patientId", params.patientId);
    if (params.userId) url.set("userId", params.userId);
    if (params.eventType) url.set("eventType", params.eventType);
    const qs = url.toString();
    return request<AdminInteractionEventsResult>(
      `/api/admin/interaction-events${qs ? `?${qs}` : ""}`,
      { token },
    );
  },

  adminGetProductMetrics: (token: string) =>
    request<AdminProductMetrics>("/api/admin/metrics/product", { token }),

  adminGetPlatformAi: (token: string) =>
    request<AdminPlatformAiSettings>("/api/admin/platform/ai", { token }),

  adminUpdatePlatformAi: (
    token: string,
    payload: {
      provider: string;
      model?: string | null;
      openAiApiKey?: string | null;
      anthropicApiKey?: string | null;
      geminiApiKey?: string | null;
      groqApiKey?: string | null;
      updateOpenAiApiKey?: boolean;
      updateAnthropicApiKey?: boolean;
      updateGeminiApiKey?: boolean;
      updateGroqApiKey?: boolean;
      useCaseRoutes?: PlatformAiUseCaseRoute[];
    },
  ) =>
    request<void>("/api/admin/platform/ai", { method: "PUT", token, body: payload }),

  adminTestPlatformAi: (token: string) =>
    request<PlatformAiTestResult>("/api/admin/platform/ai/test", { method: "POST", token }),

  adminTestPlatformAiVision: (token: string) =>
    request<PlatformAiTestResult>("/api/admin/platform/ai/test/vision", { method: "POST", token }),

  adminUpdateTenantStatus: (token: string, tenantId: string, isActive: boolean) =>
    request<void>(`/api/admin/tenants/${tenantId}/status`, {
      method: "PUT",
      token,
      body: { isActive },
    }),

  adminUpdateTenantAi: (token: string, tenantId: string, aiEnabled: boolean) =>
    request<void>(`/api/admin/tenants/${tenantId}/ai`, {
      method: "PUT",
      token,
      body: { aiEnabled },
    }),

  adminListTenantUsers: (token: string, tenantId: string) =>
    request<TenantUser[]>(`/api/admin/tenants/${tenantId}/users`, { token }),

  adminUpdateTenantUser: (token: string, tenantId: string, userId: string, isActive: boolean) =>
    request<void>(`/api/admin/tenants/${tenantId}/users/${userId}`, {
      method: "PUT",
      token,
      body: { isActive },
    }),

  adminSetTenantUserPassword: (
    token: string,
    tenantId: string,
    userId: string,
    newPassword: string,
  ) =>
    request<void>(`/api/admin/tenants/${tenantId}/users/${userId}/password`, {
      method: "PUT",
      token,
      body: { newPassword },
    }),

  adminDeleteTenantUser: (token: string, tenantId: string, userId: string) =>
    request<void>(`/api/admin/tenants/${tenantId}/users/${userId}`, { method: "DELETE", token }),

  adminListPlatformUsers: (token: string) =>
    request<AdminPlatformUser[]>("/api/admin/platform-users", { token }),

  adminCreatePlatformUser: (token: string, name: string, email: string, password: string) =>
    request<{ id: string }>("/api/admin/platform-users", {
      method: "POST",
      token,
      body: { name, email, password },
    }),

  adminUpdatePlatformUser: (
    token: string,
    userId: string,
    payload: { name?: string; email?: string; isActive?: boolean },
  ) =>
    request<void>(`/api/admin/platform-users/${userId}`, {
      method: "PUT",
      token,
      body: payload,
    }),

  adminDeletePlatformUser: (token: string, userId: string) =>
    request<void>(`/api/admin/platform-users/${userId}`, { method: "DELETE", token }),

  adminImpersonateTenant: (token: string, tenantId: string) =>
    request<LoginResponse>(`/api/admin/tenants/${tenantId}/impersonate`, { method: "POST", token }),

  adminListTemplates: (token: string, locale?: string) => {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return request<AdminMessageTemplate[]>(`/api/admin/templates${qs}`, { token });
  },

  adminGetOnboardingFlow: (token: string) =>
    request<AdminOnboardingFlow>("/api/admin/templates/onboarding-flow", { token }),

  adminUpsertTemplate: (
    token: string,
    key: string,
    content: string,
    description?: string,
    locale?: string,
    voiceContent?: string | null,
  ) =>
    request<void>(`/api/admin/templates/${encodeURIComponent(key)}`, {
      method: "PUT",
      token,
      body: { content, description, locale, voiceContent: voiceContent ?? null },
    }),

  adminResetTemplate: (token: string, key: string, locale?: string) => {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return request<void>(`/api/admin/templates/${encodeURIComponent(key)}${qs}`, {
      method: "DELETE",
      token,
    });
  },

  adminListMetaTemplates: (token: string, tenantId?: string) => {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    return request<AdminMetaTemplateList>(`/api/admin/meta/templates${qs}`, { token });
  },

  adminSubmitMetaTemplates: (
    token: string,
    payload: {
      tenantId?: string | null;
      canonicalKeys?: string[];
      onlyMissing?: boolean;
      onlyRejected?: boolean;
    },
  ) =>
    request<AdminMetaTemplateSubmitResult>("/api/admin/meta/templates/submit", {
      method: "POST",
      token,
      body: payload,
    }),

  adminUpdateMetaTemplateMapping: (
    token: string,
    canonicalKey: string,
    metaName: string,
    tenantId?: string | null,
  ) =>
    request<void>(`/api/admin/meta/templates/${encodeURIComponent(canonicalKey)}`, {
      method: "PUT",
      token,
      body: { tenantId: tenantId ?? null, metaName },
    }),

  adminUpdateMetaTemplateBody: (
    token: string,
    canonicalKey: string,
    customBody: string | null,
    tenantId?: string | null,
  ) =>
    request<void>(`/api/admin/meta/templates/${encodeURIComponent(canonicalKey)}/body`, {
      method: "PUT",
      token,
      body: { tenantId: tenantId ?? null, customBody },
    }),

  adminCreateMetaTemplate: (
    token: string,
    payload: {
      tenantId?: string | null;
      canonicalKey: string;
      metaName: string;
      body: string;
      category: string;
      variables: { name: string; example: string }[];
      buttons?: string[];
    },
  ) =>
    request<AdminMetaTemplateItem>("/api/admin/meta/templates/custom", {
      method: "POST",
      token,
      body: payload,
    }),

  adminUpdateMetaTemplate: (
    token: string,
    canonicalKey: string,
    payload: {
      tenantId?: string | null;
      metaName?: string;
      body?: string;
      category?: string;
      variables?: { name: string; example: string }[];
      buttons?: string[];
    },
  ) =>
    request<AdminMetaTemplateItem>(
      `/api/admin/meta/templates/custom/${encodeURIComponent(canonicalKey)}`,
      { method: "PUT", token, body: payload },
    ),

  adminDeleteMetaTemplate: (
    token: string,
    canonicalKey: string,
    tenantId?: string | null,
  ) => {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    return request<void>(
      `/api/admin/meta/templates/custom/${encodeURIComponent(canonicalKey)}${qs}`,
      { method: "DELETE", token },
    );
  },

  adminGetVoiceCatalog: (token: string) =>
    request<AdminVoiceCatalogResponse>("/api/admin/voice/cache/catalog", { token }),

  adminUpdateVoiceCatalogEntry: (
    token: string,
    entryId: string,
    payload: { sampleText: string; label?: string },
  ) =>
    request<AdminVoiceCatalogEntry>(`/api/admin/voice/cache/catalog/${entryId}`, {
      method: "PUT",
      token,
      body: payload,
    }),

  adminWarmVoiceCache: (
    token: string,
    payload?: {
      entryIds?: string[];
      voices?: string[];
      forceRegenerate?: boolean;
    },
  ) =>
    request<AdminVoiceWarmResult>("/api/admin/voice/cache/warm", {
      method: "POST",
      token,
      body: payload ?? {},
    }),

  adminPreviewVoiceAudio: async (
    token: string,
    params: { entryId: string; voice: "feminine" | "masculine"; force?: boolean },
  ): Promise<Blob> => {
    const qs = new URLSearchParams({
      entryId: params.entryId,
      voice: params.voice,
      force: String(params.force ?? false),
    });
    const res = await fetch(`${API_BASE}/api/admin/voice/cache/preview?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      let message = `Erro ${res.status}`;
      try {
        const data = JSON.parse(text) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // ignore
      }
      throw new ApiClientError(message, res.status);
    }
    return res.blob();
  },
};

export const IMPERSONATION_STORAGE_KEY = "kokoro.impersonation";

export const AUTH_STORAGE_KEY = "kokoro.auth";
/** Cookie compartilhado entre portal e docs (*.kokorosaude.com.br). */
export const AUTH_COOKIE_NAME = "kokoro_token";

function resolveAuthCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "kokorosaude.com.br" || host.endsWith(".kokorosaude.com.br")) {
    return ".kokorosaude.com.br";
  }
  return undefined;
}

export function setAuthCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "path=/",
    `max-age=${Math.max(maxAgeSeconds, 0)}`,
    "SameSite=Lax",
  ];
  if (window.location.protocol === "https:") parts.push("Secure");
  const domain = resolveAuthCookieDomain();
  if (domain) parts.push(`domain=${domain}`);
  document.cookie = parts.join("; ");
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  const parts = [`${AUTH_COOKIE_NAME}=`, "path=/", "max-age=0"];
  const domain = resolveAuthCookieDomain();
  if (domain) parts.push(`domain=${domain}`);
  document.cookie = parts.join("; ");
}

export interface StoredAuth {
  token: string;
  scope: "tenant" | "platform";
  user: UserInfo | null;
  platformUser: PlatformUserInfo | null;
  features: TenantFeature[];
  expiresAt: number;
  impersonating?: boolean;
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(data: Omit<StoredAuth, "expiresAt">, expiresInSeconds: number) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ ...data, expiresAt: Date.now() + expiresInSeconds * 1000 }),
  );
  setAuthCookie(data.token, expiresInSeconds);
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  clearAuthCookie();
}
