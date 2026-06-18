import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSendersTab } from "@/components/settings/SettingsSendersTab";
import { MetaEmbeddedSignupConnect } from "@/components/whatsapp/MetaEmbeddedSignupConnect";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function WhatsappConfigPage() {
  const { token, hasFeature } = useAuth();
  const canManageSenders = hasFeature(FEATURE_KEYS.whatsappSendersManage);

  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && canManageSenders,
  });

  const activeSender = senders.find((s) => s.isActive) ?? senders[0];
  const isMetaConnected =
    activeSender?.connectionSource === "EmbeddedSignup" && activeSender?.hasEmbeddedToken;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração"
        description="Conecte o número da clínica à Meta e gerencie remetentes WhatsApp da organização."
      />

      {canManageSenders && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Número WhatsApp</CardTitle>
            <CardDescription>
              {isMetaConnected
                ? "Seu número está vinculado à Meta. Webhook e token OAuth são gerenciados pela plataforma."
                : "Conecte com a Meta (recomendado) ou cadastre WABA ID e Phone ID manualmente na tabela abaixo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetaEmbeddedSignupConnect />

            {activeSender && (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant={isMetaConnected ? "default" : "outline"}>
                  {isMetaConnected ? "Conectado via Meta" : "Cadastro manual"}
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

      {!canManageSenders && (
        <p className="text-sm text-muted-foreground">
          Cadastro de remetentes não está disponível para sua conta. Fale com o administrador.
        </p>
      )}

      <SettingsSendersTab />
    </div>
  );
}
