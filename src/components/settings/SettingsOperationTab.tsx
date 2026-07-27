import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { LOCALE_LABELS, VOICE_TONES } from "@/lib/constants";
import { normalizeVoiceToneSelectValue } from "@/lib/adminTemplateTones";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  locales?: string[];
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsOperationTab({ form, locales, update }: Props) {
  return (
    <Tabs defaultValue="envio" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="envio">Envio e reengajamento</TabsTrigger>
        <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
      </TabsList>

      <TabsContent value="envio" className="mt-0">
        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsField
            htmlFor="sendWindowStart"
            label="Início da janela de envio"
            hint="Horário do dia (fuso da organização) a partir do qual lembretes e mensagens automáticas podem ser enviados."
          >
            <Input
              id="sendWindowStart"
              type="time"
              value={form.sendWindowStart}
              onChange={(e) => update("sendWindowStart", e.target.value)}
            />
          </SettingsField>

          <SettingsField
            htmlFor="sendWindowEnd"
            label="Fim da janela de envio"
            hint="Após este horário, novos envios automáticos ficam na fila até o próximo dia útil dentro da janela."
          >
            <Input
              id="sendWindowEnd"
              type="time"
              value={form.sendWindowEnd}
              onChange={(e) => update("sendWindowEnd", e.target.value)}
            />
          </SettingsField>

          <SettingsField
            htmlFor="followup"
            label="Follow-up após (horas)"
            hint="Tempo de espera após um lembrete de check-in antes de enviar um follow-up, se o paciente não respondeu."
          >
            <Input
              id="followup"
              type="number"
              min={1}
              value={form.followupAfterHours}
              onChange={(e) => update("followupAfterHours", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            htmlFor="reengagement"
            label="Tentativas de reengajamento"
            hint="Quantas vezes a Kokoro tenta reativar pacientes inativos antes de parar os envios automáticos."
          >
            <Input
              id="reengagement"
              type="number"
              min={0}
              value={form.maxReengagementAttempts}
              onChange={(e) => update("maxReengagementAttempts", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            htmlFor="inactiveDays"
            label="Dias inativo antes de reengajar"
            hint="Paciente sem interação no WhatsApp por esse período entra na fila de reengajamento (se ainda houver tentativas)."
          >
            <Input
              id="inactiveDays"
              type="number"
              min={1}
              value={form.inactiveDaysBeforeReengagement}
              onChange={(e) => update("inactiveDaysBeforeReengagement", Number(e.target.value))}
            />
          </SettingsField>
        </div>

        <div className="mt-6 space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <SettingsSwitchField
            id="medicationRefillFollowupEnabled"
            label="Lembrete de reposição (pós-estoque)"
            hint="Quando o paciente diz que acabou o remédio no check-in, oferece um toque mais tarde para ver se já conseguiu repor. Máx. 1 oferta por medicamento por dia (fuso BR)."
            checked={form.medicationRefillFollowupEnabled ?? false}
            onCheckedChange={(checked) => update("medicationRefillFollowupEnabled", checked)}
          />
          {(form.medicationRefillFollowupEnabled ?? false) && (
            <div className="max-w-xs">
              <SettingsField
                htmlFor="medicationRefillFollowupHoursBeforeDose"
                label="Fallback: horas antes da próxima dose"
                hint="Se o paciente aceitar sem escolher horário (ou não responder), o lembrete vai neste antecipo da próxima dose — sempre dentro da janela de envio (ex.: dose 08h e 2h → não dispara às 06h)."
              >
                <Input
                  id="medicationRefillFollowupHoursBeforeDose"
                  type="number"
                  min={1}
                  max={12}
                  value={form.medicationRefillFollowupHoursBeforeDose ?? 2}
                  onChange={(e) =>
                    update(
                      "medicationRefillFollowupHoursBeforeDose",
                      Math.min(12, Math.max(1, Number(e.target.value) || 2)),
                    )
                  }
                />
              </SettingsField>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="comunicacao" className="mt-0 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsField
            label="Tom de voz"
            hint="Estilo das mensagens automáticas: acolhedor, objetivo ou técnico. Afeta templates e personalização por IA."
          >
            <Select
              value={normalizeVoiceToneSelectValue(form.voiceTone)}
              onValueChange={(v) => update("voiceTone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label="Idioma"
            hint="Idioma padrão das mensagens e formatação de datas/horários para pacientes desta organização."
          >
            <Select value={form.locale} onValueChange={(v) => update("locale", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(locales ?? []).map((code) => (
                  <SelectItem key={code} value={code}>
                    {LOCALE_LABELS[code] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        <SettingsSwitchField
          id="requirePreRegisteredPatients"
          label="Somente pacientes cadastrados"
          hint="Quando ativo, o WhatsApp só responde números já cadastrados no portal. Novos contatos precisam ser incluídos pela equipe."
          checked={form.requirePreRegisteredPatients ?? false}
          onCheckedChange={(checked) => update("requirePreRegisteredPatients", checked)}
        />

        <SettingsField
          htmlFor="defaultPromoMessage"
          label="Texto padrão de promoção"
          hint="Pré-preenche campanhas e inbox de promoções. Use a variável mensagem do template Meta aprovado."
        >
          <Textarea
            id="defaultPromoMessage"
            rows={3}
            value={form.defaultPromoMessage ?? ""}
            onChange={(e) => update("defaultPromoMessage", e.target.value)}
            placeholder="Ex.: 20% de desconto em vitaminas até sexta-feira."
          />
        </SettingsField>
      </TabsContent>
    </Tabs>
  );
}
