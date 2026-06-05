import { PageHeader } from "@/components/PageHeader";
import { SettingsSendersTab } from "@/components/settings/SettingsSendersTab";

export function WhatsappPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Gerencie os números remetentes do tenant (WABA ID, Phone ID e telefone E.164) conectados à Meta Business API."
      />
      <SettingsSendersTab />
    </div>
  );
}
