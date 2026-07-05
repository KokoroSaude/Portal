import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField } from "@/components/settings/SettingsField";
import type { TenantSettings } from "@/types/api";

type InboundMode = TenantSettings["activeInboundMode"];

export function SettingsAiInboundModeSelect({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: InboundMode;
  onChange: (v: InboundMode) => void;
}) {
  return (
    <SettingsField label={label} hint={hint}>
      <Select value={value ?? "AiGuidance"} onValueChange={(v) => onChange(v as InboundMode)}>
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

export function inboundUsesAi(form: TenantSettings): boolean {
  return (
    (form.activeInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.onboardingInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.checkinInboundMode ?? "AiGuidance") !== "TemplateOnly" ||
    (form.moriskyInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.tpbInboundMode ?? "AiPersonalize") !== "TemplateOnly" ||
    (form.retentionInboundMode ?? "AiGuidance") !== "TemplateOnly"
  );
}
