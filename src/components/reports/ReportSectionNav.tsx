import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ReportSectionNavItem = {
  value: string;
  label: string;
  hidden?: boolean;
};

type ReportSectionNavProps = {
  items: ReportSectionNavItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function ReportSectionNav({ items, value, onChange, className }: ReportSectionNavProps) {
  const visible = items.filter((item) => !item.hidden);
  if (visible.length <= 1) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-1",
        className,
      )}
      role="tablist"
    >
      {visible.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === item.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

type ReportSectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function ReportSectionHeader({
  title,
  description,
  actions,
  className,
}: ReportSectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h2 className="font-serif text-lg">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
