import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookPlus, Loader2, Pencil, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import type {
  ConversationLabBubble,
  ConversationLabBubbleButton,
  ConversationLabMessage,
  ConversationLabPersona,
  UpsertConversationLabPersonaPayload,
} from "@/types/api";

type PersonaFormState = {
  slug: string;
  displayName: string;
  shortBio: string;
  portalName: string;
  preferredName: string;
  age: string;
  digitalLiteracy: string;
  conditions: string;
  medications: string;
  speechTraits: string;
  suggestedOpeners: string;
  provocations: string;
};

const emptyPersonaForm = (): PersonaFormState => ({
  slug: "",
  displayName: "",
  shortBio: "",
  portalName: "",
  preferredName: "",
  age: "45",
  digitalLiteracy: "médio",
  conditions: "",
  medications: "",
  speechTraits: "",
  suggestedOpeners: "",
  provocations: "",
});

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

function personaToForm(p: ConversationLabPersona): PersonaFormState {
  return {
    slug: p.id,
    displayName: p.displayName,
    shortBio: p.shortBio,
    portalName: p.portalName,
    preferredName: p.preferredName,
    age: String(p.age),
    digitalLiteracy: p.digitalLiteracy,
    conditions: listToLines(p.conditions),
    medications: listToLines(p.medications),
    speechTraits: listToLines(p.speechTraits),
    suggestedOpeners: listToLines(p.suggestedOpeners),
    provocations: listToLines(p.provocations),
  };
}

function extractButtons(bubbles: ConversationLabBubble[]): ConversationLabBubbleButton[] {
  for (const b of [...bubbles].reverse()) {
    if (b.buttons?.length) return [...b.buttons];
    if (b.buttonLabels?.length) {
      return b.buttonLabels.map((title) => ({ id: title, title }));
    }
  }
  return [];
}

export function AdminConversationLabPage() {
  const { token } = useAuth();
  const [tenantId, setTenantId] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<ConversationLabMessage[]>([]);
  const [pendingButtons, setPendingButtons] = useState<ConversationLabBubbleButton[]>([]);
  const [debugStep, setDebugStep] = useState<string>("—");
  const [debugMeds, setDebugMeds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [lastPair, setLastPair] = useState<{ q: string; a: string } | null>(null);
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [personaFormMode, setPersonaFormMode] = useState<"create" | "edit">("create");
  const [personaForm, setPersonaForm] = useState<PersonaFormState>(emptyPersonaForm);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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

  const examplesQuery = useQuery({
    queryKey: ["admin-lab-examples"],
    queryFn: () => api.adminListConversationLabExamples(token!, true),
    enabled: !!token,
  });

  const persona: ConversationLabPersona | undefined = personaDetailQuery.data;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, pendingButtons]);

  const startSession = useMutation({
    mutationFn: () =>
      api.adminStartConversationLabSession(token!, { tenantId, personaId }),
    onSuccess: (session) => {
      setSessionId(session.sessionId);
      setPatientId(session.patientId);
      setTranscript(session.transcript);
      setPendingButtons(extractButtons(session.lastOutbound));
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
    onSuccess: (turn, text) => {
      setTranscript(turn.transcript);
      setPendingButtons(extractButtons(turn.outbound));
      setDebugStep(turn.debug.currentStep);
      setDebugMeds(turn.debug.activeMedications ?? []);
      const reply =
        turn.outbound.map((b) => b.text).filter(Boolean).join("\n\n") ||
        [...turn.transcript]
          .reverse()
          .find((m) => m.direction.toLowerCase() === "outbound")?.content ||
        "";
      if (text.trim() && reply.trim()) setLastPair({ q: text.trim(), a: reply.trim() });
      setMessage("");
      composerRef.current?.focus();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao enviar");
    },
  });

  const promoteExample = useMutation({
    mutationFn: () =>
      api.adminPromoteConversationLabExample(token!, sessionId!, {
        tenantId,
        question: lastPair!.q,
        idealReply: lastPair!.a,
        scenario: debugStep || null,
        tags: personaId,
      }),
    onSuccess: () => {
      toast.success("Exemplo salvo — a IA usa como few-shot");
      void examplesQuery.refetch();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao salvar exemplo");
    },
  });

  const deleteExample = useMutation({
    mutationFn: (id: string) => api.adminDeleteConversationLabExample(token!, id),
    onSuccess: () => {
      toast.message("Exemplo removido");
      void examplesQuery.refetch();
    },
  });

  const savePersona = useMutation({
    mutationFn: () => {
      const age = Number(personaForm.age);
      if (!Number.isFinite(age) || age < 1 || age > 120) {
        throw new Error("Idade inválida (1–120)");
      }
      const payload: UpsertConversationLabPersonaPayload = {
        slug: personaFormMode === "create" ? personaForm.slug.trim() || null : personaForm.slug,
        displayName: personaForm.displayName.trim(),
        shortBio: personaForm.shortBio.trim(),
        portalName: personaForm.portalName.trim(),
        preferredName: personaForm.preferredName.trim(),
        age,
        digitalLiteracy: personaForm.digitalLiteracy.trim(),
        conditions: linesToList(personaForm.conditions),
        medications: linesToList(personaForm.medications),
        speechTraits: linesToList(personaForm.speechTraits),
        suggestedOpeners: linesToList(personaForm.suggestedOpeners),
        provocations: linesToList(personaForm.provocations),
        isActive: true,
      };
      if (personaFormMode === "edit") {
        return api.adminUpdateConversationLabPersona(token!, personaForm.slug, payload);
      }
      return api.adminUpsertConversationLabPersona(token!, payload);
    },
    onSuccess: (saved) => {
      toast.success(
        personaFormMode === "edit" ? "Persona atualizada" : `Persona ${saved.id} criada`,
      );
      setPersonaDialogOpen(false);
      setPersonaId(saved.id);
      void personasQuery.refetch();
      void personaDetailQuery.refetch();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Falha ao salvar persona",
      );
    },
  });

  const deletePersona = useMutation({
    mutationFn: () => api.adminDeleteConversationLabPersona(token!, personaId),
    onSuccess: () => {
      toast.message("Persona removida/desativada");
      setPersonaId("");
      void personasQuery.refetch();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Falha ao remover persona");
    },
  });

  const closeSession = useMutation({
    mutationFn: () =>
      api.adminCloseConversationLabSession(token!, tenantId, sessionId!),
    onSuccess: () => {
      setSessionId(null);
      setPatientId(null);
      setTranscript([]);
      setPendingButtons([]);
      setLastPair(null);
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

  const openCreatePersona = () => {
    setPersonaFormMode("create");
    setPersonaForm(emptyPersonaForm());
    setPersonaDialogOpen(true);
  };

  const openEditPersona = () => {
    if (!persona) return;
    setPersonaFormMode("edit");
    setPersonaForm(personaToForm(persona));
    setPersonaDialogOpen(true);
  };

  const submitText = (text: string) => {
    const t = text.trim();
    if (!t || !sessionId || sendMessage.isPending) return;
    sendMessage.mutate(t);
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-3 p-4 md:p-6">
      <PageHeader
        title="Conversation Lab"
        description="Sandbox estilo WhatsApp — personas, botões e few-shot sem Meta."
      />

      {/* Setup horizontal */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label className="text-xs">Tenant</Label>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tenant" />
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

        <div className="min-w-[180px] flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Persona</Label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={openCreatePersona}
            >
              + Nova
            </button>
          </div>
          <Select value={personaId} onValueChange={setPersonaId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Persona" />
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
          <div className="hidden max-w-xs flex-1 text-xs text-muted-foreground lg:block">
            <p className="line-clamp-2">{persona.shortBio}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {persona && (
            <>
              <Button type="button" size="sm" variant="outline" onClick={openEditPersona}>
                <Pencil className="mr-1 h-3 w-3" />
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={deletePersona.isPending}
                onClick={() => {
                  if (confirm(`Remover/desativar ${persona.id}?`)) deletePersona.mutate();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
          {!sessionId ? (
            <Button size="sm" disabled={!canStart} onClick={() => startSession.mutate()}>
              {startSession.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Iniciar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={closeSession.isPending}
              onClick={() => closeSession.mutate()}
            >
              Encerrar
            </Button>
          )}
        </div>
      </div>

      {/* Chat horizontal + sidebar */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_260px]">
        {/* WhatsApp-like pane */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#c5d0c2] bg-[#efeae2] shadow-sm dark:border-border dark:bg-muted/40">
          <div className="flex items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2.5 dark:border-border dark:bg-card">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              {(persona?.preferredName ?? "K").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {persona?.displayName ?? "Conversation Lab"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {sessionId
                  ? `${debugStep} · ${sessionId.slice(0, 8)}…`
                  : "Inicie uma sessão para conversar"}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Meta off
            </Badge>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 md:px-6">
            {transcript.length === 0 && (
              <p className="mx-auto max-w-sm rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                O bot abre com o welcome do onboarding. Use os botões abaixo ou digite como no
                WhatsApp.
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
                      "max-w-[min(85%,28rem)] rounded-lg px-3 py-1.5 text-sm shadow-sm whitespace-pre-wrap",
                      inbound
                        ? "rounded-tr-none bg-[#d9fdd3] text-foreground dark:bg-emerald-900/50"
                        : "rounded-tl-none bg-white text-foreground dark:bg-card",
                    )}
                  >
                    {m.content}
                    <div className="mt-0.5 flex items-center justify-end gap-2">
                      {m.templateKey && (
                        <span className="text-[9px] text-muted-foreground/70">{m.templateKey}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/80">
                        {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Composer fixo no rodapé do chat */}
          <div className="shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] p-2 dark:border-border dark:bg-card">
            {pendingButtons.length > 0 && sessionId && (
              <div className="mb-2 flex flex-wrap gap-2 px-1">
                {pendingButtons.map((btn) => (
                  <button
                    key={`${btn.id}-${btn.title}`}
                    type="button"
                    disabled={sendMessage.isPending}
                    className="rounded-full border border-emerald-600/40 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:opacity-50 dark:bg-background dark:text-emerald-300"
                    onClick={() => submitText(btn.id)}
                  >
                    {btn.title}
                  </button>
                ))}
              </div>
            )}

            {chips.length > 0 && sessionId && (
              <div className="mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {chips.slice(0, 10).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="shrink-0 rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                    onClick={() => setMessage(chip)}
                  >
                    {chip.length > 42 ? `${chip.slice(0, 42)}…` : chip}
                  </button>
                ))}
              </div>
            )}

            {lastPair && sessionId && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-dashed bg-background/80 px-2 py-1.5 text-[11px]">
                <p className="min-w-0 flex-1 truncate text-muted-foreground">
                  <strong>Q:</strong> {lastPair.q}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 shrink-0 text-xs"
                  disabled={promoteExample.isPending}
                  onClick={() => promoteExample.mutate()}
                >
                  {promoteExample.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BookPlus className="mr-1 h-3 w-3" />
                  )}
                  Few-shot
                </Button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <Textarea
                ref={composerRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={sessionId ? "Mensagem" : "Inicie a sessão…"}
                rows={1}
                disabled={!sessionId}
                className="min-h-[42px] max-h-28 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 shadow-sm focus-visible:ring-1 dark:bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSend) {
                    e.preventDefault();
                    submitText(message);
                  }
                }}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700"
                aria-label="Enviar mensagem"
                disabled={!canSend}
                onClick={() => submitText(message)}
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug sidebar */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border bg-card p-3 text-sm">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Step
            </p>
            <p className="font-mono text-xs">{debugStep}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Care plans
            </p>
            {debugMeds.length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
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
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Meds da persona
              </p>
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {persona.medications.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {patientId && (
            <p className="text-[10px] text-muted-foreground">
              Paciente {patientId.slice(0, 8)}…
            </p>
          )}

          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium">
              Exemplos ({examplesQuery.data?.length ?? 0})
            </p>
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {(examplesQuery.data ?? []).slice(0, 12).map((ex) => (
                <div key={ex.id} className="rounded border p-2 text-[11px] leading-snug">
                  <div className="flex items-start justify-between gap-1">
                    <p className="line-clamp-2 font-medium">{ex.question}</p>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteExample.mutate(ex.id)}
                      aria-label="Remover exemplo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{ex.idealReply}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={personaDialogOpen} onOpenChange={setPersonaDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {personaFormMode === "edit" ? "Editar persona" : "Nova persona"}
            </DialogTitle>
            <DialogDescription>
              Listas: uma linha por item (medicamentos, provocações, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Slug (id)</Label>
              <Input
                value={personaForm.slug}
                disabled={personaFormMode === "edit"}
                placeholder="ana_gestante (opcional na criação)"
                onChange={(e) =>
                  setPersonaForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome exibição</Label>
                <Input
                  value={personaForm.displayName}
                  onChange={(e) =>
                    setPersonaForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Idade</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={personaForm.age}
                  onChange={(e) => setPersonaForm((f) => ({ ...f, age: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Bio curta</Label>
              <Textarea
                rows={2}
                value={personaForm.shortBio}
                onChange={(e) =>
                  setPersonaForm((f) => ({ ...f, shortBio: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome no cadastro</Label>
                <Input
                  value={personaForm.portalName}
                  onChange={(e) =>
                    setPersonaForm((f) => ({ ...f, portalName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Nome preferido</Label>
                <Input
                  value={personaForm.preferredName}
                  onChange={(e) =>
                    setPersonaForm((f) => ({ ...f, preferredName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Letramento digital</Label>
              <Input
                value={personaForm.digitalLiteracy}
                placeholder="baixo / médio / alto"
                onChange={(e) =>
                  setPersonaForm((f) => ({ ...f, digitalLiteracy: e.target.value }))
                }
              />
            </div>
            {(
              [
                ["conditions", "Condições"],
                ["medications", "Medicamentos"],
                ["speechTraits", "Traços de fala"],
                ["suggestedOpeners", "Openers sugeridos"],
                ["provocations", "Provocações"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Textarea
                  rows={key === "provocations" || key === "medications" ? 4 : 2}
                  value={personaForm[key]}
                  onChange={(e) =>
                    setPersonaForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPersonaDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={savePersona.isPending || !personaForm.displayName.trim()}
              onClick={() => savePersona.mutate()}
            >
              {savePersona.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
