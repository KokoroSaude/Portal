import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSendersTab } from "@/components/settings/SettingsSendersTab";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  FEATURE_KEYS,
  WHATSAPP_ACTIVATION_STATUS,
  WHATSAPP_ACTIVATION_STATUS_LABELS,
  whatsAppSenderPurposeLabel,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export function WhatsappConfigPage() {
  const { token, hasFeature } = useAuth();
  const canManageSenders = hasFeature(FEATURE_KEYS.whatsappSendersManage);

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
  const isReady =
    activationStatus?.status === WHATSAPP_ACTIVATION_STATUS.Ready ||
    activationStatus?.status === WHATSAPP_ACTIVATION_STATUS.TrialActive;
  const statusLabel = activationStatus
    ? WHATSAPP_ACTIVATION_STATUS_LABELS[activationStatus.status] ?? "Desconhecido"
    : "Carregando…";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração"
        description="Cadastre o telefone da farmácia no WhatsApp (código SMS), conecte uma conta Meta existente ou use o trial Kokoro."
      />

      {canManageSenders && activationStatus && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <Badge variant={isReady ? "default" : "secondary"}>{statusLabel}</Badge>
            {activeSender && (
              <Badge variant="outline">{whatsAppSenderPurposeLabel(activeSender.purpose)}</Badge>
            )}
            {activationStatus.trialExpiresAt && (
              <span className="text-xs text-muted-foreground">
                Trial expira em {formatDateTime(activationStatus.trialExpiresAt)}
              </span>
            )}
            {activationStatus.message && (
              <span className="text-sm text-muted-foreground">{activationStatus.message}</span>
            )}
          </CardContent>
        </Card>
      )}

      {!canManageSenders ? (
        <p className="text-sm text-muted-foreground">
          Cadastro de remetentes não está disponível para sua conta. Fale com o administrador.
        </p>
      ) : (
        <SettingsSendersTab />
      )}
    </div>
  );
}
