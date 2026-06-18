import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { MetaEmbeddedSignupCompleteResult } from "@/types/api";

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    current_step?: string;
  };
};

type MetaEmbeddedSignupConnectProps = {
  onConnected?: (result: MetaEmbeddedSignupCompleteResult) => void;
};

const REDIRECT_PATH = "/whatsapp/configuracao";
const SIGNUP_WABA_KEY = "kokoro_meta_signup_waba";
const SIGNUP_PHONE_KEY = "kokoro_meta_signup_phone";
const HANDLED_CODE_KEY = "kokoro_meta_signup_handled_code";

function storeSignupIds(wabaId?: string, phoneId?: string) {
  if (wabaId) sessionStorage.setItem(SIGNUP_WABA_KEY, wabaId);
  if (phoneId) sessionStorage.setItem(SIGNUP_PHONE_KEY, phoneId);
}

function readSignupIds(): { wabaId?: string; phoneId?: string } {
  const wabaId = sessionStorage.getItem(SIGNUP_WABA_KEY) ?? undefined;
  const phoneId = sessionStorage.getItem(SIGNUP_PHONE_KEY) ?? undefined;
  sessionStorage.removeItem(SIGNUP_WABA_KEY);
  sessionStorage.removeItem(SIGNUP_PHONE_KEY);
  return { wabaId, phoneId };
}

function buildRedirectUri(): string {
  return `${window.location.origin}${REDIRECT_PATH}`;
}

function startRedirectFlow(appId: string, configId: string) {
  storeSignupIds(undefined, undefined);
  sessionStorage.removeItem(HANDLED_CODE_KEY);

  const url = new URL("https://www.facebook.com/v20.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", buildRedirectUri());
  url.searchParams.set("config_id", configId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("override_default_response_type", "true");

  window.location.assign(url.toString());
}

export function MetaEmbeddedSignupConnect({ onConnected }: MetaEmbeddedSignupConnectProps) {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const signupDataRef = useRef<{ wabaId?: string; phoneId?: string }>({});
  const completingRef = useRef(false);
  const pendingCodeRef = useRef<string | null>(null);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["meta-embedded-signup-config"],
    queryFn: () => api.getMetaEmbeddedSignupConfig(token!),
    enabled: !!token,
  });

  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.whatsappSendersManage),
  });

  const metaConnectedSender = senders.find(
    (s) => s.connectionSource === "EmbeddedSignup" && s.hasEmbeddedToken,
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }

      let payload: EmbeddedSignupMessage;
      try {
        payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (payload.type !== "WA_EMBEDDED_SIGNUP") return;

      if (payload.event === "FINISH" || payload.event === "FINISH_ONLY_WABA") {
        const wabaId = payload.data?.waba_id;
        const phoneId = payload.data?.phone_number_id;
        signupDataRef.current = { wabaId, phoneId };
        storeSignupIds(wabaId, phoneId);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const completeMutation = useMutation({
    mutationFn: (payload: { code: string; wabaId?: string; phoneId?: string; redirectUri: string }) =>
      api.completeMetaEmbeddedSignup(token!, payload),
    onSuccess: (result) => {
      if (pendingCodeRef.current) {
        sessionStorage.setItem(HANDLED_CODE_KEY, pendingCodeRef.current);
        pendingCodeRef.current = null;
      }
      toast.success("Número conectado com a Meta");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
      onConnected?.(result);
    },
    onError: (err) => {
      pendingCodeRef.current = null;
      sessionStorage.removeItem(HANDLED_CODE_KEY);
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao conectar com a Meta");
    },
  });

  const finishWithCode = useCallback(
    (code: string, wabaId?: string, phoneId?: string) => {
      if (completingRef.current) return;
      completingRef.current = true;
      pendingCodeRef.current = code;
      completeMutation.mutate(
        { code, wabaId, phoneId, redirectUri: buildRedirectUri() },
        { onSettled: () => { completingRef.current = false; } },
      );
    },
    [completeMutation],
  );

  useEffect(() => {
    if (!token || configLoading || !config?.enabled) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      toast.error(`Meta cancelou a conexão: ${params.get("error_description") ?? error}`);
      window.history.replaceState({}, "", REDIRECT_PATH);
      return;
    }

    if (!code) return;
    if (sessionStorage.getItem(HANDLED_CODE_KEY) === code) {
      window.history.replaceState({}, "", REDIRECT_PATH);
      return;
    }

    const stored = readSignupIds();
    finishWithCode(code, stored.wabaId ?? signupDataRef.current.wabaId, stored.phoneId ?? signupDataRef.current.phoneId);
    window.history.replaceState({}, "", REDIRECT_PATH);
  }, [token, configLoading, config?.enabled, finishWithCode]);

  const handleConnect = useCallback(() => {
    if (!config?.appId || !config.configId) {
      toast.error("Configuração Meta incompleta no servidor.");
      return;
    }

    signupDataRef.current = {};
    startRedirectFlow(config.appId, config.configId);
  }, [config?.appId, config?.configId]);

  if (configLoading) {
    return (
      <Button type="button" disabled>
        <Loader2 className="size-4 animate-spin" />
        Carregando…
      </Button>
    );
  }

  if (!config?.enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Conexão automática com a Meta não está disponível neste ambiente. Use o cadastro manual abaixo
        ou peça ao suporte Kokoro para habilitar Embedded Signup.
      </p>
    );
  }

  if (metaConnectedSender) {
    return (
      <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Conectado via Meta</p>
            <p className="text-muted-foreground">
              {metaConnectedSender.displayName}
              {metaConnectedSender.connectedAt
                ? ` · desde ${formatDateTime(metaConnectedSender.connectedAt)}`
                : ""}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleConnect} disabled={completeMutation.isPending}>
          {completeMutation.isPending ? "Reconectando…" : "Reconectar com Meta"}
        </Button>
      </div>
    );
  }

  const hasManualOnly = senders.length > 0;

  return (
    <div className="space-y-2">
      {hasManualOnly && (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Há remetente cadastrado manualmente. Conecte com a Meta para gravar o token OAuth e exibir{" "}
          <strong>Conectado via Meta</strong> na tabela.
        </p>
      )}
      <Button type="button" onClick={handleConnect} disabled={completeMutation.isPending}>
        {completeMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Conectando…
          </>
        ) : (
          "Conectar com Meta"
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Você será redirecionado para a Meta, fará login e verificará o celular. Ao voltar, o remetente
        manual existente é atualizado automaticamente quando for a mesma WABA/número.
      </p>
      <p className="text-xs text-muted-foreground">
        No Meta Developers, inclua em <strong>URIs de redirecionamento OAuth válidos</strong>:{" "}
        <code className="rounded bg-muted px-1">{buildRedirectUri()}</code>
      </p>
    </div>
  );
}
