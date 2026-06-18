import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { MetaEmbeddedSignupCompleteResult } from "@/types/api";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>,
      ) => void;
    };
  }
}

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

function loadFacebookSdk(appId: string): Promise<void> {
  if (window.FB) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v20.0",
      });
      resolve();
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Não foi possível carregar o SDK da Meta."));
    document.body.appendChild(script);
  });
}

export function MetaEmbeddedSignupConnect({ onConnected }: MetaEmbeddedSignupConnectProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [sdkReady, setSdkReady] = useState(false);
  const signupDataRef = useRef<{ wabaId?: string; phoneId?: string }>({});

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["meta-embedded-signup-config"],
    queryFn: () => api.getMetaEmbeddedSignupConfig(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (!config?.enabled || !config.appId) return;

    loadFacebookSdk(config.appId)
      .then(() => setSdkReady(true))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar SDK Meta"));
  }, [config?.appId, config?.enabled]);

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
        signupDataRef.current = {
          wabaId: payload.data?.waba_id,
          phoneId: payload.data?.phone_number_id,
        };
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const completeMutation = useMutation({
    mutationFn: (payload: {
      code: string;
      wabaId?: string;
      phoneId?: string;
    }) => api.completeMetaEmbeddedSignup(token!, payload),
    onSuccess: (result) => {
      toast.success("Número conectado com a Meta");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
      onConnected?.(result);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao conectar com a Meta"),
  });

  const handleConnect = useCallback(() => {
    if (!window.FB || !config?.configId) {
      toast.error("SDK Meta não está pronto.");
      return;
    }

    signupDataRef.current = {};

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          toast.error("Conexão cancelada ou sem código OAuth.");
          return;
        }

        completeMutation.mutate({
          code,
          wabaId: signupDataRef.current.wabaId,
          phoneId: signupDataRef.current.phoneId,
        });
      },
      {
        config_id: config.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  }, [completeMutation, config?.configId]);

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
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleConnect}
        disabled={!sdkReady || completeMutation.isPending}
      >
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
        Abre o fluxo oficial da Meta para verificar seu celular e vincular WABA + Phone ID automaticamente.
      </p>
    </div>
  );
}
