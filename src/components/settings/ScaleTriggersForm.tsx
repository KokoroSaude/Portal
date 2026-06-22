import { Input } from "@/components/ui/input";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";

export type ScaleTriggerFields = {
  enabled: boolean;
  onOnboarding: boolean;
  periodicDays: number | null;
  triggerAfterMisses: number | null;
  cooldownDays: number;
};

type Props = {
  scaleName: string;
  fields: ScaleTriggerFields;
  enabledKey: string;
  onOnboardingKey: string;
  periodicKey: string;
  missesKey: string;
  cooldownKey: string;
  onChange: (patch: Partial<ScaleTriggerFields>) => void;
};

export function ScaleTriggersForm({
  scaleName,
  fields,
  enabledKey,
  onOnboardingKey,
  periodicKey,
  missesKey,
  cooldownKey,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      <SettingsSwitchField
        id={enabledKey}
        label={`Habilitar ${scaleName}`}
        hint={`Ativa o envio automático e manual da escala ${scaleName} para pacientes desta organização.`}
        checked={fields.enabled}
        onCheckedChange={(checked) => onChange({ enabled: checked })}
      />

      <SettingsSwitchField
        id={onOnboardingKey}
        label="Após onboarding"
        hint="Envia a escala automaticamente quando o paciente conclui o cadastro pelo WhatsApp."
        checked={fields.onOnboarding}
        onCheckedChange={(checked) => onChange({ onOnboarding: checked })}
        disabled={!fields.enabled}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <SettingsField
          htmlFor={periodicKey}
          label="Reaplicar a cada (dias)"
          hint="Reenvia a escala periodicamente para monitorar evolução. Deixe vazio para desativar reaplicação automática."
        >
          <Input
            id={periodicKey}
            type="number"
            min={0}
            placeholder="Desligado"
            value={fields.periodicDays ?? ""}
            disabled={!fields.enabled}
            onChange={(e) =>
              onChange({
                periodicDays: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </SettingsField>

        <SettingsField
          htmlFor={missesKey}
          label="Após misses consecutivos"
          hint="Dispara a escala quando o paciente acumula check-ins perdidos seguidos, indicando risco de não-adesão."
        >
          <Input
            id={missesKey}
            type="number"
            min={0}
            placeholder="Desligado"
            value={fields.triggerAfterMisses ?? ""}
            disabled={!fields.enabled}
            onChange={(e) =>
              onChange({
                triggerAfterMisses: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </SettingsField>

        <SettingsField
          htmlFor={cooldownKey}
          label="Intervalo mínimo (dias)"
          hint="Tempo mínimo entre duas avaliações automáticas do mesmo paciente. Disparos manuais ignoram este intervalo."
        >
          <Input
            id={cooldownKey}
            type="number"
            min={1}
            value={fields.cooldownDays}
            disabled={!fields.enabled}
            onChange={(e) => onChange({ cooldownDays: Number(e.target.value) || 1 })}
          />
        </SettingsField>
      </div>
    </div>
  );
}
