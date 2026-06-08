import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowRight, ArrowUp, Plus, RotateCcw, Save } from "lucide-react";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { WhatsAppMessagePreview } from "@/components/messages/WhatsAppMessagePreview";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, JOURNEY_STEP_TYPE_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import {
  previewVariablesForJourneyStep,
  resolveJourneyStepContent,
  templateContentByKey,
} from "@/lib/journeyMessagePreview";
import type { JourneyStep } from "@/types/api";

function editableSteps(journey: { tenantSteps: JourneyStep[] | null; defaultSteps: JourneyStep[] }) {
  return journey.tenantSteps ?? journey.defaultSteps.map((s) => ({ ...s }));
}

export function JourneyPage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newStep, setNewStep] = useState({ id: "", templateKey: "custom.beneficios", description: "" });
  const { input, setInput, query } = useGridSearch();

  const { data, isLoading } = useQuery({
    queryKey: ["journey"],
    queryFn: () => api.getOnboardingJourney(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.journeyOnboardingRead),
  });

  const templatesQuery = useQuery({
    queryKey: ["templates", "journey-preview"],
    queryFn: () => api.getTemplates(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.journeyOnboardingRead),
  });

  const templatesByKey = useMemo(
    () => templateContentByKey(templatesQuery.data),
    [templatesQuery.data],
  );

  const canEditTemplates = hasFeature(FEATURE_KEYS.templatesCustomRead);

  useEffect(() => {
    if (data) {
      const next = editableSteps(data);
      setSteps(next);
      setSelectedStepId((current) => current ?? next[0]?.id ?? null);
    }
  }, [data]);

  const canWrite = hasFeature(FEATURE_KEYS.journeyOnboardingWrite);

  const saveMutation = useMutation({
    mutationFn: () => api.updateOnboardingJourney(token!, steps),
    onSuccess: () => {
      toast.success("Jornada salva");
      queryClient.invalidateQueries({ queryKey: ["journey"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetOnboardingJourney(token!),
    onSuccess: () => {
      toast.success("Jornada restaurada ao padrão");
      queryClient.invalidateQueries({ queryKey: ["journey"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao resetar"),
  });

  const filteredSteps = useMemo(
    () =>
      steps.filter((step) =>
        matchesGridSearch(
          query,
          step.id,
          step.description,
          step.type,
          step.templateKey,
          JOURNEY_STEP_TYPE_LABELS[step.type],
        ),
      ),
    [steps, query],
  );

  const filteredEffective = useMemo(
    () =>
      (data?.effectiveSteps ?? []).filter((s) =>
        matchesGridSearch(query, s.id, s.description, s.type, s.templateKey),
      ),
    [data?.effectiveSteps, query],
  );

  if (!hasFeature(FEATURE_KEYS.journeyOnboardingRead)) {
    return (
      <>
        <PageHeader title="Jornada de onboarding" description="Fluxo WhatsApp para novos pacientes" />
        <FeatureLocked
          title="Jornada não disponível"
          description="Customização da jornada não está disponível para sua conta."
        />
      </>
    );
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...steps];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  }

  function toggleEnabled(index: number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  function addMessageStep() {
    const id = newStep.id.trim() || `msg_${Date.now()}`;
    if (steps.some((s) => s.id === id)) {
      toast.error("Id já existe na jornada");
      return;
    }
    setSteps((prev) => [
      ...prev,
      {
        id,
        type: "message",
        templateKey: newStep.templateKey.trim(),
        description: newStep.description.trim() || "Mensagem customizada",
        isBuiltIn: false,
        enabled: true,
      },
    ]);
    setAddOpen(false);
    setNewStep({ id: "", templateKey: "custom.beneficios", description: "" });
    setSelectedStepId(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Jornada de onboarding"
          description="Ordem e passos do fluxo para novos pacientes via WhatsApp"
        />
        <div className="flex gap-2">
          {data?.isCustomized && canWrite && (
            <Button variant="outline" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
              <RotateCcw className="size-4" />
              Restaurar padrão
            </Button>
          )}
          {canWrite && (
            <>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="size-4" />
                    Passo mensagem
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar passo de mensagem</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Id único</Label>
                      <Input
                        placeholder="beneficios"
                        value={newStep.id}
                        onChange={(e) => setNewStep((s) => ({ ...s, id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Template key</Label>
                      <Input
                        value={newStep.templateKey}
                        onChange={(e) => setNewStep((s) => ({ ...s, templateKey: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={newStep.description}
                        onChange={(e) => setNewStep((s) => ({ ...s, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addMessageStep}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="size-4" />
                Salvar jornada
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-base">Passos do fluxo</CardTitle>
                <CardDescription>
                  {data?.isCustomized ? "Jornada customizada da organização" : "Usando fluxo padrão Kokoro"}
                </CardDescription>
              </div>
              <GridSearchBar
                value={input}
                onChange={setInput}
                placeholder="Buscar passos por id, descrição ou template"
                resultCount={filteredSteps.length}
                totalCount={steps.length}
              />
            </CardHeader>
            <CardContent>
              {filteredSteps.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {query.trim() ? "Nenhum passo corresponde à busca." : "Nenhum passo na jornada."}
                </p>
              ) : (
                <ol className="space-y-2">
                  {filteredSteps.map((step) => {
                    const index = steps.findIndex((s) => s.id === step.id);
                    const isSelected = selectedStepId === step.id;

                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedStepId(step.id)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors hover:bg-muted/60 ${
                            isSelected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : ""
                          }`}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium leading-snug">{step.description ?? step.id}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {JOURNEY_STEP_TYPE_LABELS[step.type] ?? step.type}
                              </Badge>
                              {!step.enabled && (
                                <Badge variant="muted" className="text-[10px]">
                                  Desativado
                                </Badge>
                              )}
                            </div>
                            <p className="line-clamp-2 font-mono text-xs text-muted-foreground">
                              {step.id}
                              {step.templateKey ? ` · ${step.templateKey}` : ""}
                            </p>
                          </div>
                          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhe do passo</CardTitle>
              <CardDescription>
                Ative, reordene ou revise o passo selecionado na jornada de onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStepId ? (
                (() => {
                  const step = steps.find((s) => s.id === selectedStepId);
                  const index = steps.findIndex((s) => s.id === selectedStepId);
                  if (!step || index < 0) {
                    return (
                      <p className="text-sm text-muted-foreground">Selecione um passo à esquerda.</p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </span>
                        <p className="font-medium">{step.description ?? step.id}</p>
                        <Badge variant="outline">{JOURNEY_STEP_TYPE_LABELS[step.type] ?? step.type}</Badge>
                        {step.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {step.id}
                        {step.templateKey ? ` · ${step.templateKey}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={step.enabled}
                            onCheckedChange={() => toggleEnabled(index)}
                            disabled={!canWrite}
                          />
                          <Label>{step.enabled ? "Passo ativo" : "Passo desativado"}</Label>
                        </div>
                        {canWrite && (
                          <div className="ml-auto flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => move(index, -1)}>
                              <ArrowUp className="size-4" />
                              Subir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => move(index, 1)}>
                              <ArrowDown className="size-4" />
                              Descer
                            </Button>
                          </div>
                        )}
                      </div>

                      {step.templateKey ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label className="text-sm font-medium">Mensagem enviada ao paciente</Label>
                            {canEditTemplates && (
                              <Button variant="link" className="h-auto px-0 text-xs" asChild>
                                <Link to="/templates">Editar em Templates →</Link>
                              </Button>
                            )}
                          </div>
                          {templatesQuery.isLoading ? (
                            <Skeleton className="h-32 w-full" />
                          ) : (
                            <WhatsAppMessagePreview
                              content={resolveJourneyStepContent(step, templatesByKey) ?? ""}
                              variables={previewVariablesForJourneyStep(step)}
                              emptyLabel="Template sem texto ou não encontrado. Verifique em Templates."
                            />
                          )}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                          Este passo aguarda a resposta do paciente no WhatsApp — não há mensagem automática
                          de saída.
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um passo à esquerda.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo efetivo (preview)</CardTitle>
            <CardDescription>
              Passos executados após merge, com preview das mensagens WhatsApp enviadas ao paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredEffective.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {query.trim() ? "Nenhum passo no preview corresponde à busca." : "Sem passos."}
              </p>
            ) : (
              <ol className="space-y-4">
                {filteredEffective.map((s, index) => {
                  const content = resolveJourneyStepContent(s, templatesByKey);
                  return (
                    <li key={s.id} className="rounded-xl border p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <p className="font-medium">{s.description ?? s.id}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {JOURNEY_STEP_TYPE_LABELS[s.type] ?? s.type}
                        </Badge>
                      </div>
                      {s.templateKey && content ? (
                        <WhatsAppMessagePreview
                          content={content}
                          variables={previewVariablesForJourneyStep(s)}
                          className="mt-2"
                        />
                      ) : s.templateKey ? (
                        <p className="text-sm text-muted-foreground">Mensagem não disponível para preview.</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
