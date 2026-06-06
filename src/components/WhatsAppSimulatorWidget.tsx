import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MessageCircle, Send, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiClientError, getPlatformTokenForSimulator } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { SimulatorMessage } from "@/types/api";

type WhatsAppSimulatorWidgetProps = {
  patientId: string;
};

export function WhatsAppSimulatorWidget({ patientId }: WhatsAppSimulatorWidgetProps) {
  const platformToken = getPlatformTokenForSimulator();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: status } = useQuery({
    queryKey: ["simulator-status"],
    queryFn: () => api.simulatorStatus(platformToken!),
    enabled: !!platformToken,
    staleTime: 60_000,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["simulator-messages", patientId],
    queryFn: () => api.simulatorMessages(platformToken!, patientId),
    enabled: !!platformToken && !!status?.enabled && open,
    refetchInterval: open ? 3000 : false,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["simulator-messages", patientId] });
    queryClient.invalidateQueries({ queryKey: ["patient-timeline", patientId] });
    queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
  };

  const replyMutation = useMutation({
    mutationFn: (body: string) => api.simulatorReply(platformToken!, patientId, body),
    onSuccess: () => {
      setText("");
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao simular resposta");
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () => api.simulatorTriggerReminder(platformToken!, patientId),
    onSuccess: (res) => {
      toast.success(
        res.action === "already_due"
          ? "Lembrete já vencido — aguarde o Worker"
          : "Lembrete enfileirado — aguarde o Worker",
      );
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar lembrete");
    },
  });

  if (!platformToken || !status?.enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col">
      {open && (
        <div className="mb-2 flex max-h-[min(70vh,28rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft-lg">
          <div className="flex items-center justify-between border-b bg-accent/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <span className="text-sm font-semibold">Simulador WhatsApp</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Superadmin
            </Badge>
          </div>

          <p className="border-b px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Passa pela infra real (Worker + Redis). Nenhuma mensagem Meta é enviada.
          </p>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {isLoading ? (
              <p className="text-center text-xs text-muted-foreground">Carregando…</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Nenhuma mensagem ainda. Dispare um lembrete ou envie uma resposta.
              </p>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
          </div>

          <div className="space-y-2 border-t p-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = text.trim();
                if (!trimmed) return;
                replyMutation.mutate(trimmed);
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Responder como paciente…"
                className="h-9 text-sm"
                disabled={replyMutation.isPending}
              />
              <Button type="submit" size="icon" className="size-9 shrink-0" disabled={replyMutation.isPending}>
                <Send className="size-4" />
              </Button>
            </form>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={reminderMutation.isPending}
              onClick={() => reminderMutation.mutate()}
            >
              <Zap className="size-4" />
              Disparar lembrete agora
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        className="ml-auto shadow-soft-lg"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="size-4" />
        Simulador
        {open ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
      </Button>
    </div>
  );
}

function MessageBubble({ message }: { message: SimulatorMessage }) {
  const outbound = message.direction === "outbound";

  return (
    <div className={cn("flex", outbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          outbound
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time className="mt-1 block text-[10px] opacity-70">{formatDateTime(message.createdAt)}</time>
      </div>
    </div>
  );
}
