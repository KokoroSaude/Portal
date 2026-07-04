import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportRange } from "@/contexts/ReportRangeContext";
import {
  detectRangePreset,
  parseDateOnly,
  rangeFromPreset,
  toDateOnly,
  type ReportRangePreset,
} from "@/lib/reportRange";
import { cn } from "@/lib/utils";

const PRESETS: { id: Exclude<ReportRangePreset, "custom">; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "thisMonth", label: "Este mês" },
  { id: "lastMonth", label: "Mês passado" },
];

type ReportToolbarProps = {
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
  onPresetChange?: (preset: Exclude<ReportRangePreset, "custom">) => void;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  scopeControl?: ReactNode;
  className?: string;
};

export function ReportToolbar({
  range,
  onRangeChange,
  onPresetChange,
  showSearch = false,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Buscar nesta página…",
  scopeControl,
  className,
}: ReportToolbarProps) {
  const activePreset = detectRangePreset(range);

  const handlePreset = (preset: Exclude<ReportRangePreset, "custom">) => {
    if (onPresetChange) onPresetChange(preset);
    else onRangeChange(rangeFromPreset(preset));
  };

  const handleDate = (field: "from" | "to", value: string) => {
    if (!value) return;
    const parsed = parseDateOnly(value);
    if (!parsed) return;
    onRangeChange({ ...range, [field]: toDateOnly(parsed) });
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-1 border-b border-border/60 bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {scopeControl}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={activePreset === preset.id ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => handlePreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={range.from.slice(0, 10)}
              onChange={(e) => handleDate("from", e.target.value)}
              className="h-8 w-[132px] text-xs"
              aria-label="Data inicial"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <Input
              type="date"
              value={range.to.slice(0, 10)}
              onChange={(e) => handleDate("to", e.target.value)}
              className="h-8 w-[132px] text-xs"
              aria-label="Data final"
            />
          </div>
        </div>

        {showSearch && onSearchChange && (
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pr-9 pl-9 text-sm"
              aria-label={searchPlaceholder}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
                aria-label="Limpar busca"
                onClick={() => onSearchChange("")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
