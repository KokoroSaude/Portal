import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api";

type QueryErrorStateProps = {
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function QueryErrorState({
  message = "Não foi possível carregar os dados.",
  error,
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: QueryErrorStateProps) {
  const detail =
    error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : null;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-10 text-center ${className ?? ""}`}
    >
      <AlertCircle className="size-8 text-destructive" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {detail && detail !== message && (
          <p className="text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 size-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
