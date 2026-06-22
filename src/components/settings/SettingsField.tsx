import { HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SettingsFieldProps = {
  label: string;
  hint: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function SettingsField({
  label,
  hint,
  htmlFor,
  className,
  children,
}: SettingsFieldProps) {
  return (
    <div
      className={cn(
        "group/field space-y-2 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/30",
        className,
      )}
    >
      <div className="flex items-start gap-1.5">
        <Label htmlFor={htmlFor} className="leading-snug">
          {label}
        </Label>
        <HelpCircle
          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70"
          aria-hidden
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}

type SettingsSwitchFieldProps = {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function SettingsSwitchField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: SettingsSwitchFieldProps) {
  return (
    <div className="group/field flex items-start justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/30">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start gap-1.5">
          <Label htmlFor={id} className="leading-snug">
            {label}
          </Label>
          <HelpCircle
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70"
            aria-hidden
          />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}
