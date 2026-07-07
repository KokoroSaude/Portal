import { SettingsAiPromptsSection } from "@/components/settings/SettingsAiPromptsSection";
import { PageHeader } from "@/components/PageHeader";

export function AdminAiPromptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts IA"
        description="System prompts do WhatsApp (paciente) e do copilot no portal (resumo e sugestões em /assistente-ia)."
      />
      <SettingsAiPromptsSection scope="platform" />
    </div>
  );
}
