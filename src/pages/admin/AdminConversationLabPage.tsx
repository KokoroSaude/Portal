import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookPlus, Loader2, Pencil, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [lastPair, setLastPair] = useState<{ q: string; a: string } | null>(null);
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [personaFormMode, setPersonaFormMode] = useState<"create" | "edit">("create");
  const [personaForm, setPersonaForm] = useState<PersonaFormState>(emptyPersonaForm);
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

  const examplesQuery = useQuery({
    queryKey: ["admin-lab-examples"],
    queryFn: () => api.adminListConversationLabExamples(token!, true),
    enabled: !!token,
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
    onSuccess: (turn, text) => {
      setTranscript(turn.transcript);
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

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Conversation Lab"
        description="Teste personas no pipeline real — sem WhatsApp. Crie personas e salve Q&A para few-shot da IA."
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
              <div className="flex items-center justify-between gap-2">
                <Label>Persona</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={openCreatePersona}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nova
                </Button>
              </div>
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
                  <Badge variant="outline" className="ml-1 font-mono">
                    {persona.id}
                  </Badge>
                </p>
                <p className="text-muted-foreground">
                  Cadastro: {persona.portalName} → prefere {persona.preferredName}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={openEditPersona}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive"
                    disabled={deletePersona.isPending}
                    onClick={() => {
                      if (confirm(`Remover/desativar persona ${persona.id}?`)) {
                        deletePersona.mutate();
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remover
                  </Button>
                </div>
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

            {lastPair && sessionId && (
              <div className="rounded-lg border border-dashed p-3 text-xs space-y-2">
                <p className="font-medium">Último turno — salvar como few-shot?</p>
                <p className="text-muted-foreground line-clamp-2">
                  <strong>Q:</strong> {lastPair.q}
                </p>
                <p className="text-muted-foreground line-clamp-3">
                  <strong>A:</strong> {lastPair.a}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={promoteExample.isPending}
                  onClick={() => promoteExample.mutate()}
                >
                  {promoteExample.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <BookPlus className="mr-2 h-3 w-3" />
                  )}
                  Salvar exemplo para a IA
                </Button>
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
            <CardTitle className="text-base">Debug + exemplos</CardTitle>
            <CardDescription>Pipeline e Q&A curados</CardDescription>
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

            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium">
                Exemplos ativos ({examplesQuery.data?.length ?? 0})
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {(examplesQuery.data ?? []).slice(0, 12).map((ex) => (
                  <div key={ex.id} className="rounded border p-2 text-[11px] leading-snug">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-medium line-clamp-2">{ex.question}</p>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteExample.mutate(ex.id)}
                        aria-label="Remover exemplo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mt-1">{ex.idealReply}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
