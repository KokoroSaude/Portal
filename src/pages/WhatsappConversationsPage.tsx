import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { WhatsappConversationsPanel } from "@/components/whatsapp/WhatsappConversationsPanel";
import { WhatsappDiagnosticsPanel } from "@/components/whatsapp/WhatsappDiagnosticsPanel";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";

export function WhatsappConversationsPage() {
  const { hasFeature } = useAuth();

  if (!hasFeature(FEATURE_KEYS.whatsappConversations)) {
    return (
      <>
        <PageHeader
          title="Conversas com pacientes"
          description="Veja o histórico de mensagens e responda manualmente como farmácia quando precisar."
        />
        <FeatureLocked
          title="Inbox de conversas não disponível"
          description="Este recurso não está incluído no seu plano atual."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversas com pacientes"
        description="Veja o histórico de mensagens e responda manualmente como farmácia quando precisar."
      />

      <WhatsappConversationsPanel />

      <WhatsappDiagnosticsPanel />
    </div>
  );
}
