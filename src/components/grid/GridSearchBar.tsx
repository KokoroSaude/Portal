import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GridSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  resultCount?: number;
  totalCount?: number;
};

export function GridSearchBar({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
  resultCount,
  totalCount,
}: GridSearchBarProps) {
  const showCount =
    value.trim().length > 0 &&
    resultCount !== undefined &&
    totalCount !== undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-9 pl-9"
          aria-label={placeholder}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
            aria-label="Limpar busca"
            onClick={() => onChange("")}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      {showCount && (
        <p className="text-xs text-muted-foreground">
          {resultCount} de {totalCount} resultado(s)
        </p>
      )}
    </div>
  );
}
