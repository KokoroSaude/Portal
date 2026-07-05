import { InboundConversationalModeLegend } from "@/components/settings/InboundConversationalModeLegend";
import {
  inboundUsesAi,
  SettingsAiInboundModeSelect,
} from "@/components/settings/SettingsAiInboundModeSelect";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsAiConversationModesSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      {!form.aiEnabled && inboundUsesAi(form) && (
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

      <SettingsAiInboundModeSelect
        id="activeInboundMode"
        label="Modo inbound (paciente ativo)"
        hint="Como a Kokoro responde mensagens livres de pacientes já cadastrados."
        value={form.activeInboundMode}
        onChange={(v) => update("activeInboundMode", v)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsAiInboundModeSelect
          id="onboardingInboundMode"
          label="Onboarding"
          hint="Personalização durante cadastro."
          value={form.onboardingInboundMode}
          onChange={(v) => update("onboardingInboundMode", v)}
        />
        <SettingsAiInboundModeSelect
          id="checkinInboundMode"
          label="Check-in"
          hint="Respostas ambíguas no check-in diário."
          value={form.checkinInboundMode}
          onChange={(v) => update("checkinInboundMode", v)}
        />
        <SettingsAiInboundModeSelect
          id="moriskyInboundMode"
          label="Morisky"
          hint="Intro e respostas inválidas na escala."
          value={form.moriskyInboundMode}
          onChange={(v) => update("moriskyInboundMode", v)}
        />
        <SettingsAiInboundModeSelect
          id="tpbInboundMode"
          label="TCP"
          hint="Intro e respostas inválidas na escala TCP."
          value={form.tpbInboundMode}
          onChange={(v) => update("tpbInboundMode", v)}
        />
        <SettingsAiInboundModeSelect
          id="retentionInboundMode"
          label="Retenção"
          hint="Intercept de opt-out e exit survey."
          value={form.retentionInboundMode}
          onChange={(v) => update("retentionInboundMode", v)}
        />
      </div>
    </div>
  );
}
