import { useOutletContext } from "react-router-dom";
import { SettingsAiConversationModesSection } from "@/components/settings/SettingsAiConversationModesSection";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiConversationModesPage() {
  const { form, update } = useOutletContext<SettingsAiOutletContext>();

  return <SettingsAiConversationModesSection form={form} update={update} />;
}
