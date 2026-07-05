import { useOutletContext } from "react-router-dom";
import { SettingsAiGeneralSection } from "@/components/settings/SettingsAiGeneralSection";
import { useAuth } from "@/contexts/AuthContext";
import type { SettingsAiOutletContext } from "@/pages/settings/SettingsAiLayout";

export function SettingsAiGeneralPage() {
  const { form, settings, update } = useOutletContext<SettingsAiOutletContext>();
  const { hasFeature } = useAuth();

  return (
    <SettingsAiGeneralSection
      form={form}
      settings={settings}
      hasFeature={hasFeature}
      update={update}
    />
  );
}
