import { cn } from "@/lib/utils";

export type InsightPreviewMode = "auto" | "rules" | "ai";

const OPTIONS: { value: InsightPreviewMode; label: string }[] = [
  { value: "auto", label: "Automático" },
  { value: "rules", label: "Regras" },
  { value: "ai", label: "IA" },
];

type Props = {
  value: InsightPreviewMode;
  onChange: (mode: InsightPreviewMode) => void;
  disabled?: boolean;
  className?: string;
};

export function PatientInsightPreviewModeToggle({ value, onChange, disabled, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5 text-xs",
        className,
      )}
      role="group"
      aria-label="Modo de preview do resumo"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded px-2 py-1 transition-colors",
            value === opt.value
              ? "bg-background font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
