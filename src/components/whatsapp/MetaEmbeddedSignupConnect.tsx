import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatDateTime, maskPhone } from "@/lib/utils";
import type {
  MetaEmbeddedSignupCompleteResult,
  MetaEmbeddedSignupPhoneOption,
} from "@/types/api";

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
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

  const [phonePickerOpen, setPhonePickerOpen] = useState(false);
  const [phoneOptions, setPhoneOptions] = useState<MetaEmbeddedSignupPhoneOption[]>([]);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");

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

  const handleFlowSuccess = useCallback(
    (result: MetaEmbeddedSignupCompleteResult) => {
      if (pendingCodeRef.current) {
        sessionStorage.setItem(HANDLED_CODE_KEY, pendingCodeRef.current);
        pendingCodeRef.current = null;
      }
      setPhonePickerOpen(false);
      setPendingSessionId(null);
      toast.success("Número conectado com a Meta");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
      onConnected?.(result);
    },
    [onConnected, queryClient],
  );

  const completeMutation = useMutation({
    mutationFn: (payload: {
      code?: string;
      wabaId?: string;
      phoneId?: string;
      redirectUri?: string;
      sessionId?: string;
    }) => api.completeMetaEmbeddedSignup(token!, payload),
    onSuccess: (flow) => {
      if (flow.status === "completed" && flow.result) {
        handleFlowSuccess(flow.result);
        return;
      }

      if (flow.status === "select_phone" && flow.sessionId && flow.phones?.length) {
        pendingCodeRef.current = null;
        sessionStorage.removeItem(HANDLED_CODE_KEY);
        setPendingSessionId(flow.sessionId);
        setPhoneOptions(flow.phones);
        const preferred =
          flow.phones.find((p) => !p.likelyTestNumber)?.phoneId ?? flow.phones[0]?.phoneId ?? "";
        setSelectedPhoneId(preferred);
        setPhonePickerOpen(true);
        return;
      }

      toast.error("Resposta inesperada da Meta. Tente novamente.");
    },
    onError: (err) => {
      pendingCodeRef.current = null;
      sessionStorage.removeItem(HANDLED_CODE_KEY);
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao conectar com a Meta");
    },
  });

  const confirmPhoneMutation = useMutation({
    mutationFn: () =>
      api.completeMetaEmbeddedSignup(token!, {
        sessionId: pendingSessionId!,
        phoneId: selectedPhoneId,
      }),
    onSuccess: (flow) => {
      if (flow.status === "completed" && flow.result) {
        handleFlowSuccess(flow.result);
        return;
      }
      toast.error("Não foi possível confirmar o número escolhido.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao confirmar número"),
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

  return (
    <>
      {metaConnectedSender ? (
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
      ) : (
        <div className="space-y-2">
          {senders.length > 0 && (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Conecte com a Meta para usar o número de produção (não o de teste) e gravar o token OAuth.
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
            Se sua conta Meta tiver mais de um número, você poderá escolher qual vincular ao portal.
          </p>
        </div>
      )}

      <Dialog open={phonePickerOpen} onOpenChange={setPhonePickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escolha o número WhatsApp</DialogTitle>
            <DialogDescription>
              Sua conta Meta tem mais de um número. Selecione o número de produção da clínica (não o de
              teste).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {phoneOptions.map((phone) => (
              <label
                key={phone.phoneId}
                htmlFor={phone.phoneId}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                  selectedPhoneId === phone.phoneId ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  id={phone.phoneId}
                  type="radio"
                  name="meta-phone"
                  value={phone.phoneId}
                  checked={selectedPhoneId === phone.phoneId}
                  onChange={() => setSelectedPhoneId(phone.phoneId)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <span className="block text-sm font-medium">
                    {phone.verifiedName ?? "Sem nome verificado"}
                    {phone.likelyTestNumber && (
                      <span className="ml-2 text-xs text-amber-600">(provável teste)</span>
                    )}
                  </span>
                  <span className="block font-mono text-sm text-muted-foreground">
                    {maskPhone(phone.displayPhoneNumber)}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    Phone ID {phone.phoneId}
                  </span>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => confirmPhoneMutation.mutate()}
              disabled={!selectedPhoneId || confirmPhoneMutation.isPending}
            >
              {confirmPhoneMutation.isPending ? "Vinculando…" : "Usar este número"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
