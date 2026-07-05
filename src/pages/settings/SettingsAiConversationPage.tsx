import { useOutletContext } from "react-router-dom";
import { SettingsAiConversationSection } from "@/components/settings/SettingsAiConversationSection";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiConversationPage() {
  const { form, update } = useOutletContext<SettingsAiOutletContext>();

  return <SettingsAiConversationSection form={form} update={update} />;
}
