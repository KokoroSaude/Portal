import { Sparkles } from "lucide-react";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { getAiAvailability } from "@/lib/ai-status";
import { FEATURE_KEYS } from "@/lib/constants";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  settings: TenantSettings;
  hasFeature: (key: string) => boolean;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsAiGeneralSection({ form, settings, hasFeature, update }: Props) {
  return (
    <div className="space-y-4">
      {hasFeature(FEATURE_KEYS.aiCopilot) && (
        <div className="space-y-2 rounded-lg border border-dashed bg-muted/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-medium">Status da IA neste tenant</p>
            <PatientAiAvailabilityBadge settings={settings} canConfigureTenant />
          </div>
          {settings.aiFeatures?.platformConfigured === false && (
            <p className="text-sm text-amber-900">
              A chave do provedor (Claude ou OpenAI) ainda não está configurada na plataforma Kokoro.
              Enquanto isso, o assistente usa apenas regras — mesmo com o toggle ligado.
            </p>
          )}
          {getAiAvailability(settings) === "disabled" &&
            settings.aiFeatures?.platformConfigured !== false && (
              <p className="text-sm text-muted-foreground">
                A plataforma está pronta. Ligue o toggle abaixo e salve para ativar IA no WhatsApp e
                nos resumos.
              </p>
            )}
          {getAiAvailability(settings) === "ready" && (
            <p className="text-sm text-muted-foreground">
              Tudo certo para IA. Na ficha do paciente, use <strong>Atualizar assistente</strong> — o
              badge deve mostrar <strong>Resumo: IA</strong>.
            </p>
          )}
        </div>
      )}

      <SettingsSwitchField
        id="aiEnabled"
        label="Ativar IA"
        hint="Liga NLU, resumos inteligentes e personalização de mensagens. Desligado usa apenas regras fixas no WhatsApp e relatórios."
        checked={form.aiEnabled}
        onCheckedChange={(checked) => update("aiEnabled", checked)}
      />

      {hasFeature(FEATURE_KEYS.whatsappVoice) && (
        <div className="space-y-3 rounded-lg border p-3">
          <SettingsSwitchField
            id="voiceMessagesEnabled"
            label="Mensagens em áudio (acessibilidade)"
            hint="Permite cadastrar pacientes com preferência por áudio. Respostas da Kokoro saem em voz quando habilitado."
            checked={form.voiceMessagesEnabled}
            onCheckedChange={(checked) => update("voiceMessagesEnabled", checked)}
          />
          {form.voiceMessagesEnabled && (
            <SettingsField
              label="Voz da farmácia"
              hint="Gênero da voz sintética usada nas respostas em áudio enviadas pelo WhatsApp."
            >
              <Select
                value={form.voiceGender ?? "Feminine"}
                onValueChange={(v) => update("voiceGender", v as TenantSettings["voiceGender"])}
              >
                <SelectTrigger id="voiceGender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feminine">Feminina</SelectItem>
                  <SelectItem value="Masculine">Masculina</SelectItem>
                </SelectContent>
              </Select>
            </SettingsField>
          )}
        </div>
      )}

      {hasFeature(FEATURE_KEYS.whatsappPrescription) && (
        <SettingsSwitchField
          id="prescriptionScanEnabled"
          label="Leitura de receita (PDF/imagem)"
          hint="Pacientes podem enviar foto ou PDF de receita no WhatsApp. A IA extrai medicamentos para confirmação antes dos lembretes."
          checked={form.prescriptionScanEnabled ?? false}
          onCheckedChange={(checked) => update("prescriptionScanEnabled", checked)}
          disabled={!form.aiEnabled}
        />
      )}
    </div>
  );
}
