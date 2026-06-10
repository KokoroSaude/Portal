import { PageHeader } from "@/components/PageHeader";
import { WhatsappConversationsPanel } from "@/components/whatsapp/WhatsappConversationsPanel";
import { WhatsappDiagnosticsPanel } from "@/components/whatsapp/WhatsappDiagnosticsPanel";

export function WhatsappConversationsPage() {
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
