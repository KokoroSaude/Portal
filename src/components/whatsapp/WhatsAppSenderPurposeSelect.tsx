import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WHATSAPP_SENDER_PURPOSE_OPTIONS,
  whatsAppSenderPurposeDescription,
  whatsAppSenderPurposeLabel,
} from "@/lib/constants";
import type { WhatsAppSenderPurpose } from "@/types/api";

type WhatsAppSenderPurposeSelectProps = {
  id?: string;
  value: WhatsAppSenderPurpose;
  onChange: (value: WhatsAppSenderPurpose) => void;
  disabled?: boolean;
};

export function WhatsAppSenderPurposeSelect({
  id = "sender-purpose",
  value,
  onChange,
  disabled,
}: WhatsAppSenderPurposeSelectProps) {
  const normalizedValue = value === 0 ? 1 : value;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Finalidade do número</Label>
      <Select
        value={String(normalizedValue)}
        onValueChange={(v) => onChange(Number(v) as WhatsAppSenderPurpose)}
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WHATSAPP_SENDER_PURPOSE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {whatsAppSenderPurposeDescription(normalizedValue)}
      </p>
    </div>
  );
}

type WhatsAppSenderPurposeBadgeProps = {
  purpose: WhatsAppSenderPurpose | undefined;
  showDescription?: boolean;
};

export function WhatsAppSenderPurposeBadge({
  purpose,
  showDescription = false,
}: WhatsAppSenderPurposeBadgeProps) {
  const normalizedPurpose = purpose === 0 || purpose === undefined ? 1 : purpose;

  return (
    <div className="space-y-0.5">
      <span className="text-sm font-medium">{whatsAppSenderPurposeLabel(normalizedPurpose)}</span>
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {whatsAppSenderPurposeDescription(normalizedPurpose)}
        </p>
      )}
    </div>
  );
}
