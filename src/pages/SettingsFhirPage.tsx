import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { ApiClientError, fhirGatewayApi } from "@/lib/fhir-gateway-api";
import { toast } from "sonner";

export function SettingsFhirPage() {
  const { isAdmin, hasFeature, auth } = useAuth();
  const tenantId = auth?.user?.tenantId;
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("Hospital EHR");
  const [authMethod, setAuthMethod] = useState<"client_secret_post" | "private_key_jwt">(
    "client_secret_post",
  );
  const [jwksUri, setJwksUri] = useState("");
  const [redirectUris, setRedirectUris] = useState("");
  const [allowedIssuers, setAllowedIssuers] = useState("");
  const [launchEnabled, setLaunchEnabled] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const [previewPatientId, setPreviewPatientId] = useState("");
  const [previewJson, setPreviewJson] = useState<string | null>(null);

  const [linkPatientId, setLinkPatientId] = useState("");
  const [linkExternalId, setLinkExternalId] = useState("");
  const [linkIss, setLinkIss] = useState("");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const [launchPatientId, setLaunchPatientId] = useState("");
  const [launchClientId, setLaunchClientId] = useState("");

  const enabled = hasFeature(FEATURE_KEYS.integrationsFhir);
  const gatewayBase = fhirGatewayApi.gatewayBaseUrl();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["fhir-oauth-clients", tenantId],
    queryFn: () => fhirGatewayApi.listOAuthClients(tenantId!),
    enabled: !!tenantId && isAdmin && enabled,
  });

  const { data: links = [] } = useQuery({
    queryKey: ["fhir-patient-links", tenantId],
    queryFn: () => fhirGatewayApi.listPatientLinks(tenantId!),
    enabled: !!tenantId && isAdmin && enabled,
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["fhir-webhooks", tenantId],
    queryFn: () => fhirGatewayApi.listWebhooks(tenantId!),
    enabled: !!tenantId && isAdmin && enabled,
  });

  const { data: deliveries = [] } = useQuery({
    queryKey: ["fhir-webhook-deliveries", selectedWebhookId],
    queryFn: () => fhirGatewayApi.listWebhookDeliveries(selectedWebhookId!),
    enabled: !!selectedWebhookId && isAdmin && enabled,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      fhirGatewayApi.createOAuthClient({
        tenantId: tenantId!,
        displayName,
        scopes:
          authMethod === "private_key_jwt"
            ? "system/Observation.read system/*.read fhir.read"
            : "fhir.read",
        tokenEndpointAuthMethod: authMethod,
        jwksUri: authMethod === "private_key_jwt" ? jwksUri || undefined : undefined,
        allowedIssuers: allowedIssuers
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        redirectUris: redirectUris
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        launchEnabled,
      }),
    onSuccess: (res) => {
      setCreatedSecret(res.clientSecret ?? null);
      toast.success(
        res.clientSecret
          ? "Client criado — copie o secret agora (exibido uma vez)."
          : "Client private_key_jwt criado.",
      );
      qc.invalidateQueries({ queryKey: ["fhir-oauth-clients", tenantId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao criar client"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => fhirGatewayApi.revokeOAuthClient(id),
    onSuccess: () => {
      toast.success("Client revogado");
      qc.invalidateQueries({ queryKey: ["fhir-oauth-clients", tenantId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao revogar"),
  });

  const validateJwksMutation = useMutation({
    mutationFn: (id: string) => fhirGatewayApi.validateJwks(id),
    onSuccess: (res) =>
      res.ok
        ? toast.success(`JWKS OK (${res.keyCount} chave(s))`)
        : toast.error("JWKS inválido ou vazio"),
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao validar JWKS"),
  });

  const previewMutation = useMutation({
    mutationFn: () => fhirGatewayApi.previewAdherenceObservation(previewPatientId),
    onSuccess: (json) => setPreviewJson(json),
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha no preview FHIR"),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      fhirGatewayApi.upsertPatientLink({
        tenantId: tenantId!,
        patientId: linkPatientId,
        externalFhirPatientId: linkExternalId,
        iss: linkIss,
      }),
    onSuccess: () => {
      toast.success("Vínculo paciente EHR salvo");
      qc.invalidateQueries({ queryKey: ["fhir-patient-links", tenantId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao vincular"),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id: string) => fhirGatewayApi.deletePatientLink(id),
    onSuccess: () => {
      toast.success("Vínculo removido");
      qc.invalidateQueries({ queryKey: ["fhir-patient-links", tenantId] });
    },
  });

  const webhookMutation = useMutation({
    mutationFn: () =>
      fhirGatewayApi.createWebhook({
        tenantId: tenantId!,
        targetUrl: webhookUrl,
        events: ["adherence.updated", "abandonment_risk.raised"],
      }),
    onSuccess: (res) => {
      setWebhookSecret(res.secret);
      toast.success("Webhook criado — copie o secret HMAC");
      qc.invalidateQueries({ queryKey: ["fhir-webhooks", tenantId] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao criar webhook"),
  });

  const testWebhookMutation = useMutation({
    mutationFn: (id: string) => fhirGatewayApi.testWebhook(id),
    onSuccess: () => toast.success("Evento de teste enfileirado"),
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha no teste"),
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integração FHIR / SMART" description="Clients OAuth e Observation de adesão." />
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Somente administradores do tenant.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/perfil">Ir para meu perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integração FHIR / SMART" description="Feature integrations.fhir desligada neste plano." />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Peça ao administrador da plataforma para habilitar <code>integrations.fhir</code>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const launchDebugUrl =
    gatewayBase && launchClientId && launchPatientId
      ? `${gatewayBase}/oauth/authorize?response_type=code&client_id=${encodeURIComponent(launchClientId)}&redirect_uri=${encodeURIComponent(`${window.location.origin}/pacientes/${launchPatientId}`)}&scope=${encodeURIComponent("launch/patient patient/Observation.read openid")}&state=debug&aud=${encodeURIComponent(gatewayBase)}&patient=${encodeURIComponent(launchPatientId)}`
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração FHIR / SMART"
        description="Fase 2: Private Key JWT, EHR Launch, Bulk $export e webhooks de Observation."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoints do gateway</CardTitle>
          <CardDescription>
            Token: <code>POST /oauth/token</code> · Authorize: <code>GET /oauth/authorize</code> · Metadata:{" "}
            <code>GET /.well-known/smart-configuration</code> · Bulk: <code>GET /fhir/$export</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Base: <code>{gatewayBase || "(defina VITE_FHIR_GATEWAY_URL)"}</code></p>
          <p>
            Escopos: <code>fhir.read</code>, <code>system/Observation.read</code>,{" "}
            <code>system/*.read</code> (bulk), <code>launch/patient</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar OAuth client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fhir-name">Nome</Label>
            <Input id="fhir-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fhir-auth">Método de autenticação</Label>
            <select
              id="fhir-auth"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value as typeof authMethod)}
            >
              <option value="client_secret_post">client_secret_post (sandbox)</option>
              <option value="private_key_jwt">private_key_jwt (produção)</option>
            </select>
          </div>
          {authMethod === "private_key_jwt" && (
            <div className="space-y-1">
              <Label htmlFor="fhir-jwks">JWKS URI</Label>
              <Input
                id="fhir-jwks"
                placeholder="https://hospital.example/.well-known/jwks.json"
                value={jwksUri}
                onChange={(e) => setJwksUri(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="fhir-redirects">Redirect URIs (launch, um por linha)</Label>
            <textarea
              id="fhir-redirects"
              className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={redirectUris}
              onChange={(e) => setRedirectUris(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fhir-iss">Allowed ISS (EHR issuers)</Label>
            <textarea
              id="fhir-iss"
              className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={allowedIssuers}
              onChange={(e) => setAllowedIssuers(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={launchEnabled}
              onChange={(e) => setLaunchEnabled(e.target.checked)}
            />
            Habilitar EHR Launch
          </label>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={
              createMutation.isPending ||
              !displayName.trim() ||
              (authMethod === "private_key_jwt" && !jwksUri.trim())
            }
          >
            Criar client
          </Button>
          {createdSecret && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs space-y-1">
              <p className="font-medium text-amber-900">Secret (copie agora — não será exibido de novo)</p>
              <code className="break-all">{createdSecret}</code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clients ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum client cadastrado.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {clients.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3">
                  <div>
                    <p className="font-medium">{c.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.clientId} · {c.tokenEndpointAuthMethod ?? "client_secret_post"} ·{" "}
                      {c.isActive ? "ativo" : "revogado"}
                      {c.launchEnabled ? " · launch" : ""}
                      {c.lastUsedAt ? ` · último uso ${formatDateTime(c.lastUsedAt)}` : ""}
                    </p>
                    {c.jwksUri && (
                      <p className="text-[10px] text-muted-foreground break-all">JWKS: {c.jwksUri}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {c.tokenEndpointAuthMethod === "private_key_jwt" && c.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateJwksMutation.mutate(c.id)}
                        disabled={validateJwksMutation.isPending}
                      >
                        Validar JWKS
                      </Button>
                    )}
                    {c.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(c.id)}
                        disabled={revokeMutation.isPending}
                      >
                        Revogar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Launch debug</CardTitle>
          <CardDescription>
            Simula EHR Launch com <code>patient=</code> (sandbox). Em produção use iss/launch + FhirPatientLink.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="client_id"
            value={launchClientId}
            onChange={(e) => setLaunchClientId(e.target.value)}
          />
          <Input
            placeholder="Patient UUID (Kokoro)"
            value={launchPatientId}
            onChange={(e) => setLaunchPatientId(e.target.value)}
          />
          {launchDebugUrl && (
            <Button asChild variant="secondary">
              <a href={launchDebugUrl}>Abrir authorize (sandbox)</a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vínculos paciente EHR ↔ Kokoro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Patient UUID Kokoro" value={linkPatientId} onChange={(e) => setLinkPatientId(e.target.value)} />
          <Input placeholder="External FHIR Patient ID" value={linkExternalId} onChange={(e) => setLinkExternalId(e.target.value)} />
          <Input placeholder="ISS do EHR" value={linkIss} onChange={(e) => setLinkIss(e.target.value)} />
          <Button
            onClick={() => linkMutation.mutate()}
            disabled={!linkPatientId || !linkExternalId || !linkIss || linkMutation.isPending}
          >
            Salvar vínculo
          </Button>
          <ul className="space-y-2 text-xs">
            {links.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 rounded border p-2">
                <span>
                  {l.patientId} ↔ {l.externalFhirPatientId} @ {l.iss}
                </span>
                <Button variant="outline" size="sm" onClick={() => deleteLinkMutation.mutate(l.id)}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhooks Observation → EHR</CardTitle>
          <CardDescription>
            Eventos: <code>adherence.updated</code>, <code>abandonment_risk.raised</code>. Assinatura HMAC no header{" "}
            <code>X-Kokoro-Signature</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="https://hospital.example/fhir/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <Button
            onClick={() => webhookMutation.mutate()}
            disabled={!webhookUrl.trim() || webhookMutation.isPending}
          >
            Criar subscription
          </Button>
          {webhookSecret && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs">
              <p className="font-medium text-amber-900">Secret HMAC (uma vez)</p>
              <code className="break-all">{webhookSecret}</code>
            </div>
          )}
          <ul className="space-y-2 text-sm">
            {webhooks.map((w) => (
              <li key={w.id} className="rounded border p-3 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium break-all">{w.targetUrl}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.isActive ? "ativo" : "revogado"} · {w.events?.join(", ")}
                      {w.lastDeliveryStatus ? ` · ${w.lastDeliveryStatus}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedWebhookId(w.id)}>
                      Entregas
                    </Button>
                    {w.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWebhookMutation.mutate(w.id)}
                      >
                        Enviar teste
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {selectedWebhookId && (
            <div className="text-xs space-y-1">
              <p className="font-medium">Últimas entregas</p>
              {deliveries.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma ainda.</p>
              ) : (
                deliveries.map((d) => (
                  <p key={d.id} className="text-muted-foreground">
                    {d.eventType} · tentativas {d.attemptCount} ·{" "}
                    {d.deliveredAt ? "OK" : d.deadLettered ? "DLQ" : "pendente"}
                    {d.lastError ? ` · ${d.lastError}` : ""}
                  </p>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview Observation (staff)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Patient UUID"
            value={previewPatientId}
            onChange={(e) => setPreviewPatientId(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!previewPatientId.trim() || previewMutation.isPending}
            onClick={() => previewMutation.mutate()}
          >
            Carregar JSON
          </Button>
          {previewJson && (
            <pre className="max-h-80 overflow-auto rounded border bg-muted/30 p-3 text-xs">{previewJson}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
