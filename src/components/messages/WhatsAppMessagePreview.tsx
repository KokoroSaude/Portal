import { MessageCircle } from "lucide-react";
import { substituteMessageVariables, type MessagePreviewVariables } from "@/lib/messagePreview";
import { cn } from "@/lib/utils";

type WhatsAppMessagePreviewProps = {
  content: string;
  variables?: MessagePreviewVariables;
  className?: string;
  emptyLabel?: string;
};

export function WhatsAppMessagePreview({
  content,
  variables,
  className,
  emptyLabel = "Digite o texto do template para ver o preview.",
}: WhatsAppMessagePreviewProps) {
  const trimmed = content.trim();
  const preview = trimmed ? substituteMessageVariables(trimmed, variables) : "";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-[#ECE5DD] p-4 dark:bg-muted/40",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageCircle className="size-3.5" />
        Preview WhatsApp
      </div>
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-2xl rounded-br-md bg-[#DCF8C6] px-3 py-2 text-sm text-foreground shadow-sm dark:bg-primary/20">
          {preview ? (
            <p className="whitespace-pre-wrap break-words">{preview}</p>
          ) : (
            <p className="text-muted-foreground">{emptyLabel}</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Variáveis de exemplo: {"{nome}"}, {"{medicamento}"}, {"{horario}"}, {"{saudacao}"}.
      </p>
    </div>
  );
}
