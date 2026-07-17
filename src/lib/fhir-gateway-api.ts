const FHIR_BASE = (import.meta.env.VITE_FHIR_GATEWAY_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const FHIR_ADMIN_KEY = (import.meta.env.VITE_FHIR_GATEWAY_ADMIN_KEY as string | undefined) ?? "";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function gatewayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!FHIR_BASE) throw new ApiClientError("VITE_FHIR_GATEWAY_URL não configurada", 0);
  const headers = new Headers(init.headers);
  headers.set("X-Fhir-Gateway-Key", FHIR_ADMIN_KEY);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${FHIR_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiClientError(text || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("fhir+json") || ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as T;
}

export type FhirOAuthClientRow = {
  id: string;
  tenantId: string;
  clientId: string;
  displayName: string;
  scopes: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
  tokenEndpointAuthMethod?: string;
  jwksUri?: string | null;
  launchEnabled?: boolean;
  allowedIssuers?: string[];
  redirectUris?: string[];
};

export type CreatedFhirOAuthClient = FhirOAuthClientRow & { clientSecret?: string | null };

export type FhirPatientLinkRow = {
  id: string;
  tenantId: string;
  patientId: string;
  externalFhirPatientId: string;
  iss: string;
  createdAt: string;
};

export type FhirWebhookRow = {
  id: string;
  tenantId: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
  lastDeliveryAt?: string | null;
  lastDeliveryStatus?: string | null;
  events: string[];
};

export type CreatedFhirWebhook = FhirWebhookRow & { secret: string };

export const fhirGatewayApi = {
  listOAuthClients: (tenantId: string) =>
    gatewayRequest<FhirOAuthClientRow[]>(`/admin/oauth-clients?tenantId=${encodeURIComponent(tenantId)}`),

  createOAuthClient: (body: {
    tenantId: string;
    displayName: string;
    scopes?: string;
    tokenEndpointAuthMethod?: string;
    jwksUri?: string;
    jwksInline?: string;
    allowedIssuers?: string[];
    redirectUris?: string[];
    launchEnabled?: boolean;
  }) =>
    gatewayRequest<CreatedFhirOAuthClient>("/admin/oauth-clients", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateOAuthClient: (
    id: string,
    body: {
      displayName?: string;
      scopes?: string;
      tokenEndpointAuthMethod?: string;
      jwksUri?: string | null;
      jwksInline?: string | null;
      allowedIssuers?: string[];
      redirectUris?: string[];
      launchEnabled?: boolean;
    },
  ) =>
    gatewayRequest<FhirOAuthClientRow>(`/admin/oauth-clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  validateJwks: (id: string) =>
    gatewayRequest<{ ok: boolean; keyCount: number }>(`/admin/oauth-clients/${id}/validate-jwks`, {
      method: "POST",
    }),

  revokeOAuthClient: (id: string) =>
    gatewayRequest<void>(`/admin/oauth-clients/${id}/revoke`, { method: "POST" }),

  previewAdherenceObservation: async (patientId: string) => {
    if (!FHIR_BASE) throw new ApiClientError("VITE_FHIR_GATEWAY_URL não configurada", 0);
    const res = await fetch(
      `${FHIR_BASE}/admin/preview/Patient/${encodeURIComponent(patientId)}/Observation/adherence`,
      { headers: { "X-Fhir-Gateway-Key": FHIR_ADMIN_KEY } },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new ApiClientError(text || res.statusText, res.status);
    }
    return res.text();
  },

  listPatientLinks: (tenantId: string) =>
    gatewayRequest<FhirPatientLinkRow[]>(`/admin/patient-links?tenantId=${encodeURIComponent(tenantId)}`),

  upsertPatientLink: (body: {
    tenantId: string;
    patientId: string;
    externalFhirPatientId: string;
    iss: string;
  }) =>
    gatewayRequest<FhirPatientLinkRow>("/admin/patient-links", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deletePatientLink: (id: string) =>
    gatewayRequest<void>(`/admin/patient-links/${id}`, { method: "DELETE" }),

  listWebhooks: (tenantId: string) =>
    gatewayRequest<FhirWebhookRow[]>(`/admin/webhooks?tenantId=${encodeURIComponent(tenantId)}`),

  createWebhook: (body: { tenantId: string; targetUrl: string; events?: string[] }) =>
    gatewayRequest<CreatedFhirWebhook>("/admin/webhooks", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  testWebhook: (id: string) =>
    gatewayRequest<{ queued: boolean }>(`/admin/webhooks/${id}/test`, { method: "POST" }),

  revokeWebhook: (id: string) =>
    gatewayRequest<void>(`/admin/webhooks/${id}/revoke`, { method: "POST" }),

  listWebhookDeliveries: (id: string) =>
    gatewayRequest<
      Array<{
        id: string;
        eventType: string;
        attemptCount: number;
        deliveredAt?: string | null;
        deadLettered: boolean;
        lastError?: string | null;
        createdAt: string;
        patientId: string;
      }>
    >(`/admin/webhooks/${id}/deliveries`),

  gatewayBaseUrl: () => FHIR_BASE,
};
