import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ConversationLabMessage, ConversationLabPersona } from "@/types/api";

export function AdminConversationLabPage() {
  const { token } = useAuth();
  const [tenantId, setTenantId] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<ConversationLabMessage[]>([]);
  const [debugStep, setDebugStep] = useState<string>("—");
  const [debugMeds, setDebugMeds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants-lab"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  const personasQuery = useQuery({
    queryKey: ["admin-lab-personas"],
    queryFn: () => api.adminListConversationLabPersonas(token!),
    enabled: !!token,
  });

  const personaDetailQuery = useQuery({
    queryKey: ["admin-lab-persona", personaId],
    queryFn: () => api.adminGetConversationLabPersona(token!, personaId),
    enabled: !!token && !!personaId,
  });

  const persona: ConversationLabPersona | undefined = personaDetailQuery.data;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const startSession = useMutation({
    mutationFn: () =>
      api.adminStartConversationLabSession(token!, { tenantId, personaId }),
    onSuccess: (session) => {
      setSessionId(session.sessionId);
      setPatientId(session.patientId);
      setTranscript(session.transcript);
      setDebugStep(session.debug.currentStep);
      setDebugMeds(session.debug.activeMedications ?? []);
      toast.success(`Sessão com ${session.personaDisplayName} — zero WhatsApp`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao iniciar sessão");
    },
  });

  const sendMessage = useMutation({
    mutationFn: (text: string) =>
      api.adminSendConversationLabMessage(token!, sessionId!, { tenantId, text }),
    onSuccess: (turn) => {
      setTranscript(turn.transcript);
      setDebugStep(turn.debug.currentStep);
      setDebugMeds(turn.debug.activeMedications ?? []);
      setMessage("");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao enviar");
    },
  });

  const closeSession = useMutation({
    mutationFn: () =>
      api.adminCloseConversationLabSession(token!, tenantId, sessionId!),
    onSuccess: () => {
      setSessionId(null);
      setPatientId(null);
      setTranscript([]);
      setDebugStep("—");
      setDebugMeds([]);
      toast.message("Sessão encerrada");
    },
  });

  const chips = useMemo(() => {
    if (!persona) return [];
    return [...persona.suggestedOpeners, ...persona.provocations];
  }, [persona]);

  const canStart = !!token && !!tenantId && !!personaId && !startSession.isPending;
  const canSend =
    !!token && !!sessionId && !!message.trim() && !sendMessage.isPending;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Conversation Lab"
        description="Teste personas no pipeline real — sem enviar WhatsApp. Ideal para regressão de abandono precoce."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup</CardTitle>
            <CardDescription>Tenant sandbox + persona</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tenant" />
                </SelectTrigger>
                <SelectContent>
                  {(tenantsQuery.data ?? [])
                    .filter((t) => t.isActive)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Persona</Label>
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a persona" />
                </SelectTrigger>
                <SelectContent>
                  {(personasQuery.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {persona && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
                <p className="font-medium">{persona.displayName}</p>
                <p className="text-muted-foreground">{persona.shortBio}</p>
                <p>
                  <Badge variant="secondary">{persona.digitalLiteracy}</Badge>
                </p>
                <p className="text-muted-foreground">
                  Cadastro: {persona.portalName} → prefere {persona.preferredName}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                disabled={!canStart}
                onClick={() => startSession.mutate()}
              >
                {startSession.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Iniciar sessão
              </Button>
              {sessionId && (
                <Button
                  variant="outline"
                  disabled={closeSession.isPending}
                  onClick={() => closeSession.mutate()}
                >
                  Encerrar sessão
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-[520px] flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Chat (sandbox)</CardTitle>
            <CardDescription>
              {sessionId
                ? `Sessão ${sessionId.slice(0, 8)}… · paciente ${patientId?.slice(0, 8)}…`
                : "Inicie uma sessão para conversar"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 p-4">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
              {transcript.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma mensagem ainda. O bot abre com o welcome do onboarding.
                </p>
              )}
              {transcript.map((m) => {
                const inbound = m.direction.toLowerCase() === "inbound";
                return (
                  <div
                    key={m.id}
                    className={cn("flex", inbound ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                        inbound
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border",
                      )}
                    >
                      {m.content}
                      {m.templateKey && (
                        <p className="mt-1 text-[10px] opacity-70">{m.templateKey}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {chips.length > 0 && sessionId && (
              <div className="flex flex-wrap gap-2">
                {chips.slice(0, 8).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="rounded-full border bg-background px-3 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => setMessage(chip)}
                  >
                    {chip.length > 72 ? `${chip.slice(0, 72)}…` : chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Fale como a persona…"
                rows={2}
                disabled={!sessionId}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSend) {
                    e.preventDefault();
                    sendMessage.mutate(message.trim());
                  }
                }}
              />
              <Button
                className="shrink-0 self-end"
                disabled={!canSend}
                onClick={() => sendMessage.mutate(message.trim())}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Debug</CardTitle>
            <CardDescription>Estado do pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Current step</p>
              <p className="font-mono text-xs">{debugStep}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Care plans</p>
              {debugMeds.length === 0 ? (
                <p className="text-xs">—</p>
              ) : (
                <ul className="list-inside list-disc text-xs">
                  {debugMeds.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
            {persona && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Polifarmácia da persona</p>
                <ul className="list-inside list-disc text-xs text-muted-foreground">
                  {persona.medications.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <Badge variant="outline">Meta: off · Lab capture</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
