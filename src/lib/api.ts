import type {
  AdminFeature,
  AdminPlan,
  AdminTenant,
  AdherenceReport,
  AdherenceTrendPoint,
  CarePlanUpdate,
  CreateTenantResponse,
  EngagementReport,
  OperationsReport,
  PatientAdherenceRank,
  PatientFunnel,
  PeriodComparison,
  SenderPerformance,
  JourneyStep,
  LoginResponse,
  MessageTemplate,
  OnboardingJourney,
  Patient,
  PagedResult,
  PlanFeatureUpdate,
  PublicPlan,
  SimulatorMessage,
  SimulatorSession,
  SimulatorStatus,
  TenantFeature,
  TenantSettings,
  TenantSubscription,
  TenantUser,
  TimelineEvent,
  UserInfo,
  PlatformUserInfo,
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
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
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
    const err = data as { error?: string; title?: string } | undefined;
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

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: { email } }),

  createTenant: (payload: {
    tenantName: string;
    tenantSlug: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => request<CreateTenantResponse>("/api/tenants", { method: "POST", body: payload }),

  getPatients: (token: string, params: { page?: number; pageSize?: number; status?: string; search?: string }) =>
    request<PagedResult<Patient>>(`/api/patients${qs(params)}`, { token }),

  getPatient: (token: string, id: string) =>
    request<Patient>(`/api/patients/${id}`, { token }),

  getPatientTimeline: (token: string, id: string, page = 1, pageSize = 20) =>
    request<TimelineEvent[]>(`/api/patients/${id}/timeline${qs({ page, pageSize })}`, { token }),

  pausePatient: (token: string, id: string, reason?: string, pauseUntil?: string) =>
    request<void>(`/api/patients/${id}/pause`, { method: "POST", token, body: { reason, pauseUntil } }),

  resumePatient: (token: string, id: string) =>
    request<void>(`/api/patients/${id}/resume`, { method: "POST", token }),

  updateCarePlan: (token: string, patientId: string, payload: CarePlanUpdate) =>
    request<{ carePlanId: string }>(`/api/patients/${patientId}/care-plan`, {
      method: "PATCH",
      token,
      body: payload,
    }),

  getAdherenceReport: (token: string, from?: string, to?: string) =>
    request<AdherenceReport>(`/api/reports/adherence${qs({ from, to })}`, { token }),

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

  listSenders: (token: string) => request<WhatsappSender[]>("/api/senders", { token }),

  createSender: (
    token: string,
    payload: { phoneNumber: string; displayName: string; wabaId: string; phoneId: string },
  ) => request<{ id: string }>("/api/senders", { method: "POST", token, body: payload }),

  updateSender: (
    token: string,
    senderId: string,
    payload: { displayName?: string; isActive?: boolean },
  ) => request<void>(`/api/senders/${senderId}`, { method: "PUT", token, body: payload }),

  getSettings: (token: string) => request<TenantSettings>("/api/settings", { token }),

  updateSettings: (token: string, payload: Partial<TenantSettings>) =>
    request<void>("/api/settings", { method: "PUT", token, body: payload }),

  getSubscription: (token: string) =>
    request<TenantSubscription>("/api/subscription/me", { token }),

  getLocales: () => request<string[]>("/api/subscription/locales"),

  getPublicPlans: () => request<PublicPlan[]>("/api/subscription/plans"),

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
  adminListPlans: (token: string) => request<AdminPlan[]>("/api/admin/plans", { token }),

  adminCreatePlan: (token: string, key: string, name: string, sortOrder: number) =>
    request<{ id: string }>("/api/admin/plans", { method: "POST", token, body: { key, name, sortOrder } }),

  adminUpdatePlan: (token: string, planId: string, name: string, sortOrder: number, isActive: boolean) =>
    request<void>(`/api/admin/plans/${planId}`, {
      method: "PUT",
      token,
      body: { name, sortOrder, isActive },
    }),

  adminGetPlanFeatures: (token: string, planId: string) =>
    request<TenantFeature[]>(`/api/admin/plans/${planId}/features`, { token }),

  adminUpdatePlanFeatures: (token: string, planId: string, features: PlanFeatureUpdate[]) =>
    request<void>(`/api/admin/plans/${planId}/features`, { method: "PUT", token, body: { features } }),

  adminListFeatures: (token: string) => request<AdminFeature[]>("/api/admin/features", { token }),

  adminCreateFeature: (
    token: string,
    key: string,
    name: string,
    category: string,
    valueType: string,
  ) =>
    request<{ id: string }>("/api/admin/features", {
      method: "POST",
      token,
      body: { key, name, category, valueType },
    }),

  adminListTenants: (token: string) => request<AdminTenant[]>("/api/admin/tenants", { token }),

  adminAssignTenantPlan: (token: string, tenantId: string, planId: string) =>
    request<void>(`/api/admin/tenants/${tenantId}/plan`, { method: "PUT", token, body: { planId } }),

  adminCreatePlatformUser: (token: string, name: string, email: string, password: string) =>
    request<{ id: string }>("/api/admin/platform-users", {
      method: "POST",
      token,
      body: { name, email, password },
    }),

  adminImpersonateTenant: (token: string, tenantId: string) =>
    request<LoginResponse>(`/api/admin/tenants/${tenantId}/impersonate`, { method: "POST", token }),

  simulatorStatus: (token: string) =>
    request<SimulatorStatus>("/api/admin/simulator/status", { token }),

  simulatorCreateSession: (
    token: string,
    body: {
      name: string;
      voiceTone: string;
      medication: string;
      dosage?: string;
      scheduledTimes: string;
      startOnboarding?: boolean;
    },
  ) =>
    request<SimulatorSession>("/api/admin/simulator/sessions", {
      method: "POST",
      token,
      body,
    }),

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
