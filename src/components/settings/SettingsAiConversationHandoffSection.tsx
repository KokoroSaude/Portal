import { Input } from "@/components/ui/input";
import { SettingsField } from "@/components/settings/SettingsField";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsAiConversationHandoffSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Quando a conversa é transferida para atendimento humano, o paciente vê o telefone da farmácia. Os delays
        simulam tempo de digitação antes de cada resposta automática.
      </p>

      <SettingsField
        htmlFor="pharmacyContactPhone"
        label="Telefone da farmácia (handoff)"
        hint="Número exibido ao paciente quando a conversa é transferida para atendimento humano."
      >
        <Input
          id="pharmacyContactPhone"
          type="tel"
          placeholder="+55 11 99999-9999"
          value={form.pharmacyContactPhone ?? ""}
          onChange={(e) => update("pharmacyContactPhone", e.target.value || null)}
        />
      </SettingsField>

      <div className="grid gap-2 sm:grid-cols-2">
        <SettingsField
          htmlFor="humanLatencyMinSeconds"
          label="Delay humano mínimo (s)"
          hint="Tempo mínimo de espera antes de enviar resposta, simulando digitação humana."
        >
          <Input
            id="humanLatencyMinSeconds"
            type="number"
            min={0}
            step={0.5}
            value={form.humanLatencyMinSeconds ?? 2}
            onChange={(e) =>
              update("humanLatencyMinSeconds", Number.parseFloat(e.target.value) || 0)
            }
          />
        </SettingsField>

        <SettingsField
          htmlFor="humanLatencyMaxSeconds"
          label="Delay humano máximo (s)"
          hint="Tempo máximo de espera proporcional ao tamanho da mensagem."
        >
          <Input
            id="humanLatencyMaxSeconds"
            type="number"
            min={0}
            step={0.5}
            value={form.humanLatencyMaxSeconds ?? 8}
            onChange={(e) =>
              update("humanLatencyMaxSeconds", Number.parseFloat(e.target.value) || 0)
            }
          />
        </SettingsField>
      </div>
    </div>
  );
}
