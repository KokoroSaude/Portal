import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { InboundConversationalModeLegend } from "@/components/settings/InboundConversationalModeLegend";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

function InboundModeSelect({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: TenantSettings["activeInboundMode"];
  onChange: (v: TenantSettings["activeInboundMode"]) => void;
}) {
  return (
    <SettingsField label={label} hint={hint}>
      <Select value={value ?? "AiGuidance"} onValueChange={(v) => onChange(v as TenantSettings["activeInboundMode"])}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TemplateOnly">Somente template</SelectItem>
          <SelectItem value="AiPersonalize">IA personalizada</SelectItem>
          <SelectItem value="AiGuidance">IA com orientação</SelectItem>
        </SelectContent>
      </Select>
    </SettingsField>
  );
}

export function SettingsAiConversationSection({ form, update }: Props) {
  const inboundUsesAi =
    (form.activeInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.onboardingInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.checkinInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.moriskyInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.tpbInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.retentionInboundMode ?? "AiGuidance") !== "TemplateOnly";

  return (
    <div className="space-y-4">
      {!form.aiEnabled && inboundUsesAi && (
        <p className="text-sm text-amber-900">
          Os modos <strong>IA com orientação</strong> e <strong>IA personalizada</strong> só funcionam com o
          toggle <strong>Ativar IA</strong> ligado em Geral. Sem isso, as respostas usam templates e regras fixas.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Botões e listas do WhatsApp (Sim/Não, menus) continuam interativos. A timeline pode mostrar{" "}
        <strong>Template</strong> nesses casos mesmo quando o texto foi reescrito pela IA — veja o badge de
        origem na mensagem de texto livre e em lembretes personalizados.
      </p>

      <InboundConversationalModeLegend />

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

      <InboundModeSelect
        id="activeInboundMode"
        label="Modo inbound (paciente ativo)"
        hint="Como a Kokoro responde mensagens livres de pacientes já cadastrados."
        value={form.activeInboundMode}
        onChange={(v) => update("activeInboundMode", v)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <InboundModeSelect
          id="onboardingInboundMode"
          label="Onboarding"
          hint="Personalização durante cadastro."
          value={form.onboardingInboundMode}
          onChange={(v) => update("onboardingInboundMode", v)}
        />
        <InboundModeSelect
          id="checkinInboundMode"
          label="Check-in"
          hint="Respostas ambíguas no check-in diário."
          value={form.checkinInboundMode}
          onChange={(v) => update("checkinInboundMode", v)}
        />
        <InboundModeSelect
          id="moriskyInboundMode"
          label="Morisky"
          hint="Intro e respostas inválidas na escala."
          value={form.moriskyInboundMode}
          onChange={(v) => update("moriskyInboundMode", v)}
        />
        <InboundModeSelect
          id="tpbInboundMode"
          label="TCP"
          hint="Intro e respostas inválidas na escala TCP."
          value={form.tpbInboundMode}
          onChange={(v) => update("tpbInboundMode", v)}
        />
        <InboundModeSelect
          id="retentionInboundMode"
          label="Retenção"
          hint="Intercept de opt-out e exit survey."
          value={form.retentionInboundMode}
          onChange={(v) => update("retentionInboundMode", v)}
        />
      </div>

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
