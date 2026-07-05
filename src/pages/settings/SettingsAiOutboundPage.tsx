import { useOutletContext } from "react-router-dom";
import { SettingsAiOutboundSection } from "@/components/settings/SettingsAiOutboundSection";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiOutboundPage() {
  const { form, update } = useOutletContext<SettingsAiOutletContext>();

  return <SettingsAiOutboundSection form={form} update={update} />;
}
