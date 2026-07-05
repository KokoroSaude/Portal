import { useOutletContext } from "react-router-dom";
import { SettingsAiConversationAutomationSection } from "@/components/settings/SettingsAiConversationAutomationSection";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiConversationAutomationPage() {
  const { form, update } = useOutletContext<SettingsAiOutletContext>();

  return <SettingsAiConversationAutomationSection form={form} update={update} />;
}
