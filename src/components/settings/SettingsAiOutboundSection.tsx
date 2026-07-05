import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField } from "@/components/settings/SettingsField";
import { OutboundContentModeLegend } from "@/components/settings/InboundConversationalModeLegend";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsAiOutboundSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <SettingsField
        label="Modo de conteúdo das mensagens"
        hint="Lembretes, follow-ups e marcos. Fora da janela de 24h do WhatsApp, o envio usa template Meta aprovado (sem IA no corpo)."
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

      <OutboundContentModeLegend />

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
    </div>
  );
}
