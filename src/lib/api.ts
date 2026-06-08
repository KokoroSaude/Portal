import type {
  AdminMessageTemplate,
  AdminOnboardingFlow,
  AdminPlatformUser,
  AdminProductMetrics,
  AdminAdherenceReport,
  AdminEngagementReport,
  AdminOperationsReport,
  AdminPatientAdherenceRank,
  AdminPatientFunnel,
  AdminPeriodComparison,
  AdminSenderPerformance,
  AdminTenant,
  AdherenceReport,
  AdherenceTrendPoint,
  CarePlanUpdate,
  CreateTenantResponse,
  CreatePatientResponse,
  EngagementReport,
  OperationsReport,
  PatientAdherenceRank,
  PatientFunnel,
  PeriodComparison,
  ReportInsight,
  SenderPerformance,
  JourneyStep,
  LoginResponse,
  MessageTemplate,
  OnboardingJourney,
  Patient,
  PagedResult,
  SimulatorMessage,
  SimulatorPatient,
  SimulatorSession,
  SimulatorSessionListItem,
  SimulatorStatus,
  TenantFeature,
  TenantSettings,
  TenantSubscription,
  TenantUser,
  TimelineEvent,
  UserInfo,
  UserProfile,
  PlatformUserInfo,
  WhatsappConversation,
  WhatsappConversationThread,
  WhatsappDiagnostics,
  WhatsappSender,
} from "@/types/api";
import { API_BASE } from "@/lib/config";

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
    const err = data as { error?: string; title?: string; code?: string } | undefined;
    if (res.status === 403 && err?.code === "tenant_inactive") {
      window.dispatchEvent(new CustomEvent("kokoro:tenant-inactive"));
    }
    throw new ApiClientError(
      err?.error ?? err?.title ?? `Erro ${res.status}`,
      res.status,
      data,
    );
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
    request<LoginResponse>("/api/auth/login", { method: "POST", body: { email, password } }),

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
      const err = data as { error?: string; title?: string } | undefined;
      throw new ApiClientError(
        err?.error ?? err?.title ?? `Erro ${res.status}`,
        res.status,
        data,
      );
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
    payload: { phone: string; name?: string; sendWelcome?: boolean },
  ) =>
    request<CreatePatientResponse>("/api/patients", { method: "POST", token, body: payload }),

  updatePatient: (token: string, id: string, payload: { phone?: string; name?: string }) =>
    request<void>(`/api/patients/${id}`, { method: "PUT", token, body: payload }),

  getPatient: (token: string, id: string) =>
    request<Patient>(`/api/patients/${id}`, { token }),

  getPatientTimeline: (token: string, id: string, page = 1, pageSize = 20) =>
    request<TimelineEvent[]>(`/api/patients/${id}/timeline${qs({ page, pageSize })}`, { token }),

  pausePatient: (token: string, id: string, reason?: string, pauseUntil?: string) =>
    request<void>(`/api/patients/${id}/pause`, { method: "POST", token, body: { reason, pauseUntil } }),

  resumePatient: (token: string, id: string) =>
    request<void>(`/api/patients/${id}/resume`, { method: "POST", token }),

  deletePatient: (token: string, id: string) =>
    request<void>(`/api/patients/${id}`, { method: "DELETE", token }),

  updateCarePlan: (token: string, patientId: string, payload: CarePlanUpdate) =>
    request<{ carePlanId: string }>(`/api/patients/${patientId}/care-plan`, {
      method: "PATCH",
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

  getEngagementInsights: (token: string, from?: string, to?: string) =>
    request<ReportInsight>(`/api/reports/engagement/insights${qs({ from, to })}`, {
      method: "POST",
      token,
    }),

  getPatientInsight: (token: string, patientId: string) =>
    request<ReportInsight>(`/api/patients/${patientId}/insight`, { method: "POST", token }),

  getEngagementReport: (token: string, from?: string, to?: string, patientId?: string) =>
    request<EngagementReport>(`/api/reports/engagement${qs({ from, to, patientId })}`, { token }),

  getAdherenceTrend: (token: string, from?: string, to?: string) =>
    request<AdherenceTrendPoint[]>(`/api/reports/adherence/trend${qs({ from, to })}`, { token }),

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

  getPeriodComparison: (token: string, from?: string, to?: string) =>
    request<PeriodComparison>(`/api/reports/comparison${qs({ from, to })}`, { token }),

  exportPatientsCsv: async (token: string, status?: string, from?: string, to?: string) => {
    const res = await fetch(
      `${API_BASE}/api/reports/patients/export${qs({ status, from, to })}`,
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
      const err = data as { error?: string; title?: string } | undefined;
      throw new ApiClientError(
        err?.error ?? err?.title ?? `Erro ${res.status}`,
        res.status,
        data,
      );
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

  listSenders: (token: string) => request<WhatsappSender[]>("/api/senders", { token }),

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
    },
  ) => request<void>(`/api/senders/${senderId}`, { method: "PUT", token, body: payload }),

  getWhatsAppDiagnostics: (token: string, limit = 50) =>
    request<WhatsappDiagnostics>(`/api/whatsapp/diagnostics?limit=${limit}`, { token }),

  listWhatsAppConversations: (token: string, limit = 30) =>
    request<WhatsappConversation[]>(`/api/whatsapp/conversations?limit=${limit}`, { token }),

  getWhatsAppConversationMessages: (token: string, patientId: string, limit = 200) =>
    request<WhatsappConversationThread>(
      `/api/whatsapp/conversations/${patientId}/messages?limit=${limit}`,
      { token },
    ),

  deleteWhatsAppConversationMessages: (token: string, patientId: string) =>
    request<{ deleted: number }>(`/api/whatsapp/conversations/${patientId}/messages`, {
      method: "DELETE",
      token,
    }),

  clearWhatsAppDiagnosticEvents: (token: string) =>
    request<void>("/api/whatsapp/diagnostics/events", { method: "DELETE", token }),

  getSettings: (token: string) => request<TenantSettings>("/api/settings", { token }),

  updateSettings: (token: string, payload: Partial<TenantSettings>) =>
    request<void>("/api/settings", { method: "PUT", token, body: payload }),

  getSubscription: (token: string) =>
    request<TenantSubscription>("/api/subscription/me", { token }),

  getLocales: () => request<string[]>("/api/subscription/locales"),

  getTemplates: (token: string) => request<MessageTemplate[]>("/api/templates", { token }),

  upsertTemplate: (token: string, key: string, content: string, description?: string) =>
    request<void>(`/api/templates/${encodeURIComponent(key)}`, {
      method: "PUT",
      token,
      body: { content, description },
    }),

  resetTemplate: (token: string, key: string) =>
    request<void>(`/api/templates/${encodeURIComponent(key)}`, { method: "DELETE", token }),

  getOnboardingJourney: (token: string) =>
    request<OnboardingJourney>("/api/journey/onboarding", { token }),

  updateOnboardingJourney: (token: string, steps: JourneyStep[]) =>
    request<void>("/api/journey/onboarding", { method: "PUT", token, body: { steps } }),

  resetOnboardingJourney: (token: string) =>
    request<void>("/api/journey/onboarding", { method: "DELETE", token }),

  // Admin
  adminListTenants: (token: string) => request<AdminTenant[]>("/api/admin/tenants", { token }),

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

  adminGetProductMetrics: (token: string) =>
    request<AdminProductMetrics>("/api/admin/metrics/product", { token }),

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
  ) =>
    request<void>(`/api/admin/templates/${encodeURIComponent(key)}`, {
      method: "PUT",
      token,
      body: { content, description, locale },
    }),

  adminResetTemplate: (token: string, key: string, locale?: string) => {
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return request<void>(`/api/admin/templates/${encodeURIComponent(key)}${qs}`, {
      method: "DELETE",
      token,
    });
  },

  simulatorStatus: (token: string) =>
    request<SimulatorStatus>("/api/admin/simulator/status", { token }),

  simulatorListSessions: (token: string, limit = 50) =>
    request<SimulatorSessionListItem[]>(`/api/admin/simulator/sessions${qs({ limit })}`, { token }),

  simulatorCreateSession: (
    token: string,
    body: {
      name?: string;
      voiceTone: string;
      medication?: string;
      dosage?: string;
      scheduledTimes?: string;
      startOnboarding?: boolean;
    },
  ) =>
    request<SimulatorSession>("/api/admin/simulator/sessions", {
      method: "POST",
      token,
      body,
    }),

  simulatorPatient: (token: string, patientId: string) =>
    request<SimulatorPatient>(`/api/admin/simulator/patients/${patientId}`, { token }),

  simulatorMessages: (token: string, patientId: string) =>
    request<SimulatorMessage[]>(`/api/admin/simulator/patients/${patientId}/messages`, {
      token,
    }),

  simulatorReply: (token: string, patientId: string, text: string) =>
    request<{ processed: boolean; responseSent: string | null; eventType: string | null }>(
      `/api/admin/simulator/patients/${patientId}/reply`,
      { method: "POST", token, body: { text } },
    ),

  simulatorTriggerReminder: (token: string, patientId: string) =>
    request<{ reminderId?: string; action: string }>(
      `/api/admin/simulator/patients/${patientId}/trigger-reminder`,
      { method: "POST", token },
    ),

  simulatorTriggerMilestone: (token: string, patientId: string, days = 7) =>
    request<{ text: string; personalizationSource: string; wamId?: string }>(
      `/api/admin/simulator/patients/${patientId}/trigger-milestone`,
      { method: "POST", token, body: { days } },
    ),
};

export function getSimulatorToken(): string | null {
  const auth = loadAuth();
  if (auth?.scope === "platform" && auth.token) return auth.token;
  try {
    const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as StoredAuth).token;
  } catch {
    return null;
  }
}

/** @deprecated Use getSimulatorToken or auth.token from useAuth */
export function getPlatformTokenForSimulator(): string | null {
  return getSimulatorToken();
}

export const IMPERSONATION_STORAGE_KEY = "kokoro.impersonation";

export const AUTH_STORAGE_KEY = "kokoro.auth";

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
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
