import { PageHeader } from "@/components/PageHeader";
import { WhatsappConversationsPanel } from "@/components/whatsapp/WhatsappConversationsPanel";
import { WhatsappDiagnosticsPanel } from "@/components/whatsapp/WhatsappDiagnosticsPanel";

export function WhatsappConversationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversas e Logs da Meta"
        description="Acompanhe conversas com pacientes e eventos de diagnóstico recebidos da Meta Business API."
      />

      <WhatsappConversationsPanel />

      <WhatsappDiagnosticsPanel />
    </div>
  );
}
