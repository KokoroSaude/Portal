import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSendersTab } from "@/components/settings/SettingsSendersTab";
import { MetaEmbeddedSignupConnect } from "@/components/whatsapp/MetaEmbeddedSignupConnect";
import { WhatsAppActivationWizard } from "@/components/whatsapp/WhatsAppActivationWizard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS, WHATSAPP_ACTIVATION_STATUS } from "@/lib/constants";

export function WhatsappConfigPage() {
  const { token, hasFeature } = useAuth();
  const canManageSenders = hasFeature(FEATURE_KEYS.whatsappSendersManage);
  const [addNumberRequested, setAddNumberRequested] = useState(false);

  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && canManageSenders,
  });

  const { data: activationStatus } = useQuery({
    queryKey: ["whatsapp-activation-status"],
    queryFn: () => api.getWhatsAppActivationStatus(token!),
    enabled: !!token && canManageSenders,
  });

  const activeSender = senders.find((s) => s.isActive) ?? senders[0];
  const isMetaEmbedded =
    activeSender?.connectionSource === "EmbeddedSignup" && activeSender?.hasEmbeddedToken;
  const isPlatformOnboarding = activeSender?.connectionSource === "PlatformOnboarding";
  const isReady =
    activationStatus?.status === WHATSAPP_ACTIVATION_STATUS.Ready ||
    activationStatus?.status === WHATSAPP_ACTIVATION_STATUS.TrialActive;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração"
        description="Cadastre o telefone da farmácia no WhatsApp (código SMS) ou use o trial Kokoro."
      />

      {canManageSenders && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Conectar WhatsApp</CardTitle>
            <CardDescription>
              {isReady
                ? "Seu número está ativo. Você pode adicionar outros números ou personalizar o perfil na tabela abaixo."
                : "Digite o número da farmácia e confirme o código — sem login na Meta."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WhatsAppActivationWizard
              startOnPhone={addNumberRequested}
              onStartOnPhoneConsumed={() => setAddNumberRequested(false)}
            />

            {activeSender && (
              <div className="flex flex-wrap gap-2 text-sm pt-2 border-t">
                <Badge variant={isReady ? "default" : "outline"}>
                  {isPlatformOnboarding
                    ? "Conectado via Kokoro"
                    : isMetaEmbedded
                      ? "Conectado via Meta"
                      : "Cadastro manual"}
                </Badge>
                {activeSender.wabaId && (
                  <span className="text-muted-foreground font-mono text-xs">
                    WABA {activeSender.wabaId} · Phone {activeSender.phoneId}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canManageSenders && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">WABA própria (opcional)</CardTitle>
            <CardDescription>
              Conecte com login Meta se a farmácia já tem conta Business separada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetaEmbeddedSignupConnect />
          </CardContent>
        </Card>
      )}

      {!canManageSenders && (
        <p className="text-sm text-muted-foreground">
          Cadastro de remetentes não está disponível para sua conta. Fale com o administrador.
        </p>
      )}

      <SettingsSendersTab onAddViaOtp={() => setAddNumberRequested(true)} />
    </div>
  );
}
