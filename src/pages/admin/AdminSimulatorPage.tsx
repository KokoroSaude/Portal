import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, UserPlus, Zap } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { cn, formatDateTime, maskPhone } from "@/lib/utils";
import type { SimulatorMessage, SimulatorPatient } from "@/types/api";

const VOICE_TONES = [
  { value: "Acolhedor", label: "Acolhedor" },
  { value: "Motivacional", label: "Motivacional" },
  { value: "Direto", label: "Direto" },
] as const;

type SimMode = "onboarding" | "active";

function voiceToneFromQuery(tone: string | null): string {
  if (!tone) return "Acolhedor";
  const match = VOICE_TONES.find((t) => t.value.toLowerCase() === tone.toLowerCase());
  return match?.value ?? tone;
}

function modeFromQuery(mode: string | null): SimMode {
  return mode === "active" ? "active" : "onboarding";
}

function patientLabel(patient: SimulatorPatient | undefined, fallback: string) {
  if (!patient) return fallback;
  return patient.name?.trim() || "Novo paciente";
}

export function AdminSimulatorPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<SimMode>(() => modeFromQuery(searchParams.get("mode")));
  const [patientId, setPatientId] = useState<string | null>(null);

  const [form, setForm] = useState(() => ({
    voiceTone: voiceToneFromQuery(searchParams.get("tone")),
    name: "Maria Simulada",
    medication: "Metformina 500mg",
    dosage: "1 comprimido",
    scheduledTimes: "08:00,20:00",
  }));

  useEffect(() => {
    const nextMode = modeFromQuery(searchParams.get("mode"));
    const nextTone = voiceToneFromQuery(searchParams.get("tone"));
    setMode(nextMode);
    setForm((f) => ({ ...f, voiceTone: nextTone }));
  }, [searchParams]);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["simulator-status"],
    queryFn: () => api.simulatorStatus(token!),
    enabled: !!token,
  });

  const { data: patient } = useQuery({
    queryKey: ["simulator-patient", patientId],
    queryFn: () => api.simulatorPatient(token!, patientId!),
    enabled: !!token && !!patientId && !!status?.enabled,
    refetchInterval: patientId ? 1000 : false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["simulator-messages", patientId],
    queryFn: () => api.simulatorMessages(token!, patientId!),
    enabled: !!token && !!patientId && !!status?.enabled,
    refetchInterval: patientId ? 1000 : false,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createMutation = useMutation({
    mutationFn: () => {
      if (mode === "onboarding") {
        return api.simulatorCreateSession(token!, {
          voiceTone: form.voiceTone,
          startOnboarding: true,
        });
      }
      return api.simulatorCreateSession(token!, {
        name: form.name,
        voiceTone: form.voiceTone,
        medication: form.medication,
        dosage: form.dosage || undefined,
        scheduledTimes: form.scheduledTimes,
        startOnboarding: false,
      });
    },
    onSuccess: async (created) => {
      setPatientId(created.patientId);
      setText("");
      await queryClient.refetchQueries({ queryKey: ["simulator-messages", created.patientId] });
      await queryClient.refetchQueries({ queryKey: ["simulator-patient", created.patientId] });
      toast.success(
        mode === "onboarding"
          ? created.welcomeSent
            ? "Conversa iniciada — responda como paciente no chat."
            : "Novo paciente criado — aguardando boas-vindas."
          : "Paciente ativo criado — teste lembretes no chat.",
      );
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar sessão");
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => api.simulatorReply(token!, patientId!, body),
    onSuccess: async () => {
      setText("");
      await queryClient.refetchQueries({ queryKey: ["simulator-messages", patientId] });
      await queryClient.refetchQueries({ queryKey: ["simulator-patient", patientId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao simular resposta");
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () => api.simulatorTriggerReminder(token!, patientId!),
    onSuccess: async (res) => {
      toast.success(res.action === "sent" ? "Lembrete enviado" : "Lembrete processado");
      await queryClient.refetchQueries({ queryKey: ["simulator-messages", patientId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar lembrete");
    },
  });

  function startNewPatient() {
    setPatientId(null);
    setText("");
    createMutation.mutate();
  }

  const patientStatus = patient?.status ?? (mode === "onboarding" ? "Onboarding" : "Active");
  const canTriggerReminder = patientStatus === "Active";

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
        description="Teste o onboarding pela conversa ou crie um paciente já ativo para lembretes."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>
                {mode === "onboarding"
                  ? "Somente o tom de voz. Nome, medicamento e horários vêm das suas respostas no chat."
                  : "Paciente já cadastrado, sem passar pelo fluxo de onboarding."}
              </CardDescription>
            </div>
            <Tabs value={mode} onValueChange={(v) => setMode(v as SimMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                <TabsTrigger value="active">Paciente ativo</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {mode === "active" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sim-name">Nome</Label>
                  <Input
                    id="sim-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
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
              </>
            )}

            <Button
              className="w-full"
              disabled={createMutation.isPending}
              onClick={() => startNewPatient()}
            >
              <UserPlus className="size-4" />
              {createMutation.isPending
                ? "Criando…"
                : patientId
                  ? "Novo paciente"
                  : mode === "onboarding"
                    ? "Iniciar conversa"
                    : "Criar paciente ativo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex min-h-[32rem] flex-col">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-primary" />
              <div>
                <CardTitle className="text-base">Conversa simulada</CardTitle>
                {patientId ? (
                  <CardDescription>
                    {patientLabel(patient, "Novo paciente")} · {maskPhone(patient?.phone ?? "")} ·{" "}
                    {form.voiceTone}
                  </CardDescription>
                ) : (
                  <CardDescription>
                    {mode === "onboarding"
                      ? "Inicie uma conversa e responda como paciente"
                      : "Crie um paciente ativo para testar lembretes"}
                  </CardDescription>
                )}
              </div>
            </div>
            {patientId && <Badge variant="secondary">{patientStatus}</Badge>}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-0 p-0">
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {!patientId ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {mode === "onboarding"
                    ? 'Clique em "Iniciar conversa" e responda SIM, seu nome, medicamento e horários como no WhatsApp real.'
                    : 'Preencha os dados e clique em "Criar paciente ativo".'}
                </p>
              ) : messagesLoading ? (
                <p className="text-center text-sm text-muted-foreground">Carregando mensagens…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Aguardando mensagens…
                </p>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
              )}
            </div>

            {patientId && (
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
                  disabled={reminderMutation.isPending || !canTriggerReminder}
                  onClick={() => reminderMutation.mutate()}
                >
                  <Zap className="size-4" />
                  Disparar lembrete agora
                </Button>
                {!canTriggerReminder && (
                  <p className="text-center text-[11px] text-muted-foreground">
                    Conclua o onboarding na conversa antes de disparar lembretes.
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
