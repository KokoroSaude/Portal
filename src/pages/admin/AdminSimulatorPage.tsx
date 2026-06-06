import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { cn, formatDateTime, maskPhone } from "@/lib/utils";
import type { SimulatorMessage, SimulatorSession } from "@/types/api";

const VOICE_TONES = [
  { value: "Acolhedor", label: "Acolhedor" },
  { value: "Motivacional", label: "Motivacional" },
  { value: "Direto", label: "Direto" },
] as const;

export function AdminSimulatorPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [session, setSession] = useState<SimulatorSession | null>(null);

  const [form, setForm] = useState({
    name: "Maria Simulada",
    voiceTone: "Acolhedor",
    medication: "Metformina 500mg",
    dosage: "1 comprimido",
    scheduledTimes: "08:00,20:00",
    startOnboarding: false,
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["simulator-status"],
    queryFn: () => api.simulatorStatus(token!),
    enabled: !!token,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["simulator-messages", session?.patientId],
    queryFn: () => api.simulatorMessages(token!, session!.patientId),
    enabled: !!token && !!session?.patientId && !!status?.enabled,
    refetchInterval: session ? 3000 : false,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.simulatorCreateSession(token!, {
        name: form.name,
        voiceTone: form.voiceTone,
        medication: form.medication,
        dosage: form.dosage || undefined,
        scheduledTimes: form.scheduledTimes,
        startOnboarding: form.startOnboarding,
      }),
    onSuccess: (created) => {
      setSession(created);
      setText("");
      queryClient.invalidateQueries({ queryKey: ["simulator-messages", created.patientId] });
      toast.success("Paciente fictício criado — simule o WhatsApp ao lado");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar sessão");
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => api.simulatorReply(token!, session!.patientId, body),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["simulator-messages", session?.patientId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao simular resposta");
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () => api.simulatorTriggerReminder(token!, session!.patientId),
    onSuccess: (res) => {
      toast.success(
        res.action === "already_due"
          ? "Lembrete já vencido — aguarde o Worker"
          : "Lembrete enfileirado — aguarde o Worker",
      );
      queryClient.invalidateQueries({ queryKey: ["simulator-messages", session?.patientId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar lembrete");
    },
  });

  if (statusLoading) {
    return <p className="text-sm text-muted-foreground">Carregando simulador…</p>;
  }

  if (!status?.enabled) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Simulador WhatsApp"
          description="Teste lembretes e respostas sem impersonar tenant nem usar a Meta."
        />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Simulador desabilitado na API (
            <code className="text-xs">Meta:DisableSimulatorEndpoints</code>).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulador WhatsApp"
        description="Crie um paciente fictício na hora, escolha o tom de voz e converse pelo fluxo real (Worker + Redis)."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Novo paciente fictício</CardTitle>
            <CardDescription>
              Dados básicos e tom de voz. Por padrão entra já ativo, pronto para lembretes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sim-name">Nome</Label>
              <Input
                id="sim-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tom de voz</Label>
              <Select
                value={form.voiceTone}
                onValueChange={(v) => setForm((f) => ({ ...f, voiceTone: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-med">Medicamento</Label>
              <Input
                id="sim-med"
                value={form.medication}
                onChange={(e) => setForm((f) => ({ ...f, medication: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-dose">Dosagem</Label>
              <Input
                id="sim-dose"
                placeholder="1 comprimido"
                value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sim-times">Horários</Label>
              <Input
                id="sim-times"
                placeholder="08:00,20:00"
                value={form.scheduledTimes}
                onChange={(e) => setForm((f) => ({ ...f, scheduledTimes: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Testar onboarding</p>
                <p className="text-xs text-muted-foreground">
                  Se desligado, paciente já fica ativo com care plan.
                </p>
              </div>
              <Switch
                checked={form.startOnboarding}
                onCheckedChange={(v) => setForm((f) => ({ ...f, startOnboarding: v }))}
              />
            </div>

            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Criando…" : "Criar e simular"}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex min-h-[32rem] flex-col">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base">Conversa simulada</CardTitle>
                {session ? (
                  <CardDescription>
                    {session.name} · {maskPhone(session.phone)} · {session.voiceTone}
                  </CardDescription>
                ) : (
                  <CardDescription>Crie um paciente para abrir o chat</CardDescription>
                )}
              </div>
            </div>
            {session && (
              <Badge variant="secondary">{session.patientStatus}</Badge>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-0 p-0">
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {!session ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Preencha o formulário e clique em &quot;Criar e simular&quot;.
                </p>
              ) : messagesLoading ? (
                <p className="text-center text-sm text-muted-foreground">Carregando mensagens…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Nenhuma mensagem ainda. Dispare um lembrete ou envie uma resposta como paciente.
                </p>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
            </div>

            {session && (
              <div className="space-y-2 border-t p-4">
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
                    disabled={replyMutation.isPending}
                  />
                  <Button type="submit" size="icon" disabled={replyMutation.isPending}>
                    <Send className="size-4" />
                  </Button>
                </form>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={reminderMutation.isPending || session.patientStatus !== "Active"}
                  onClick={() => reminderMutation.mutate()}
                >
                  <Zap className="size-4" />
                  Disparar lembrete agora
                </Button>
                {session.patientStatus !== "Active" && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    Conclua o onboarding antes de disparar lembretes.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
