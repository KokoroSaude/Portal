import { SettingsAiPromptsSection } from "@/components/settings/SettingsAiPromptsSection";
import { PageHeader } from "@/components/PageHeader";

export function AdminAiPromptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompts IA — mensagens ao paciente"
        description="System prompts usados quando a IA personaliza onboarding, escalas, lembretes e nudges no WhatsApp."
      />
      <SettingsAiPromptsSection scope="platform" />
    </div>
  );
}
