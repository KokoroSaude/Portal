import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export function SettingsAiTab({ form, settings, hasFeature, update }: Props) {
  const inboundUsesAi =
    (form.activeInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.onboardingInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.checkinInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.moriskyInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.tpbInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.retentionInboundMode ?? "AiGuidance") !== "TemplateOnly";

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

      <SettingsField
        label="Modo de conteúdo das mensagens"
        hint="Como lembretes e respostas são gerados. Fora da janela de 24h do WhatsApp, mensagens usam template Meta aprovado."
      >
        <Select
          value={form.outboundContentMode ?? "TemplateOnly"}
          onValueChange={(v) =>
            update("outboundContentMode", v as TenantSettings["outboundContentMode"])
          }
        >
          <SelectTrigger id="outboundContentMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TemplateOnly">Somente template</SelectItem>
            <SelectItem value="AiOnly">Somente IA</SelectItem>
            <SelectItem value="Alternate">Intercalar template e IA</SelectItem>
          </SelectContent>
        </Select>
      </SettingsField>

      {(form.outboundContentMode ?? "TemplateOnly") === "Alternate" && (
        <SettingsField
          label="Regra de intercalação"
          hint="Por paciente alterna a cada envio; por tipo de mensagem alterna separadamente lembretes, follow-ups e marcos."
        >
          <Select
            value={form.outboundAlternateStrategy ?? "PerPatient"}
            onValueChange={(v) =>
              update("outboundAlternateStrategy", v as TenantSettings["outboundAlternateStrategy"])
            }
          >
            <SelectTrigger id="outboundAlternateStrategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PerPatient">Por paciente (alterna a cada envio)</SelectItem>
              <SelectItem value="PerMessageKind">Por tipo de mensagem</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      )}

      <div className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-medium">Conversação WhatsApp</p>

        {!form.aiEnabled && inboundUsesAi && (
          <p className="text-sm text-amber-900">
            Os modos <strong>IA com orientação</strong> e <strong>IA personalizada</strong> só funcionam com o
            toggle <strong>Ativar IA</strong> ligado acima. Sem isso, as respostas usam templates e regras fixas.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Cliques no menu do WhatsApp (botões e listas) continuam com respostas estruturadas (Template). A IA entra
          em texto livre, respostas ambíguas e desvios nos fluxos configurados — não substitui check-in confirmado
          (Sim/Não) nem ações diretas do menu.
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
    </div>
  );
}
