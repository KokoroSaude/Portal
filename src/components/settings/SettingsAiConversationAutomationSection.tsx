import { SettingsSwitchField } from "@/components/settings/SettingsField";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsAiConversationAutomationSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Opções que reduzem carga operacional da farmácia e mantêm parceiros informados sobre o programa.
      </p>

      <SettingsSwitchField
        id="selfServicePauseEnabled"
        label="Pausa self-service"
        hint="Permite que pacientes pausem lembretes pelo WhatsApp sem falar com a farmácia."
        checked={form.selfServicePauseEnabled ?? true}
        onCheckedChange={(checked) => update("selfServicePauseEnabled", checked)}
      />

      <SettingsSwitchField
        id="weeklyDigestEnabled"
        label="Digest semanal para parceiros"
        hint="Envia resumo semanal de métricas conversacionais para contatos da farmácia."
        checked={form.weeklyDigestEnabled ?? true}
        onCheckedChange={(checked) => update("weeklyDigestEnabled", checked)}
      />
    </div>
  );
}
