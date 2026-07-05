import { useOutletContext } from "react-router-dom";
import { SettingsAiConversationHandoffSection } from "@/components/settings/SettingsAiConversationHandoffSection";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiConversationHandoffPage() {
  const { form, update } = useOutletContext<SettingsAiOutletContext>();

  return <SettingsAiConversationHandoffSection form={form} update={update} />;
}
