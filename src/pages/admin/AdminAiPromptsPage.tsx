import { SettingsAiPromptsSection } from "@/components/settings/SettingsAiPromptsSection";
import { PageHeader } from "@/components/PageHeader";

export function AdminAiPromptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts IA"
        description="Edite os system prompts de lembretes, conquistas, marcos (D7/D30) e demais mensagens WhatsApp. Aba Paciente → texto enviado ao paciente."
      />
      <SettingsAiPromptsSection scope="platform" />
    </div>
  );
}
