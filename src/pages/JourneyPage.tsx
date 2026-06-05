import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save } from "lucide-react";
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
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, JOURNEY_STEP_TYPE_LABELS } from "@/lib/constants";
import type { JourneyStep } from "@/types/api";

function editableSteps(journey: { tenantSteps: JourneyStep[] | null; defaultSteps: JourneyStep[] }) {
  return journey.tenantSteps ?? journey.defaultSteps.map((s) => ({ ...s }));
}

export function JourneyPage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newStep, setNewStep] = useState({ id: "", templateKey: "custom.beneficios", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["journey"],
    queryFn: () => api.getOnboardingJourney(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.journeyOnboardingRead),
  });

  useEffect(() => {
    if (data) setSteps(editableSteps(data));
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

  if (!hasFeature(FEATURE_KEYS.journeyOnboardingRead)) {
    return (
      <>
        <PageHeader title="Jornada de onboarding" description="Fluxo WhatsApp para novos pacientes" />
        <FeatureLocked
          title="Jornada não disponível"
          description="Faça upgrade para visualizar e customizar o onboarding."
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
        <Card>
          <CardHeader>
            <CardTitle>Passos</CardTitle>
            <CardDescription>
              {data?.isCustomized ? "Jornada customizada do tenant" : "Usando fluxo padrão Kokoro"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{step.description ?? step.id}</p>
                    <Badge variant="outline">{JOURNEY_STEP_TYPE_LABELS[step.type] ?? step.type}</Badge>
                    {step.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {step.id}
                    {step.templateKey ? ` · ${step.templateKey}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.enabled}
                    onCheckedChange={() => toggleEnabled(index)}
                    disabled={!canWrite}
                  />
                  {canWrite && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => move(index, -1)}>
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => move(index, 1)}>
                        <ArrowDown className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo efetivo (preview)</CardTitle>
            <CardDescription>Passos que serão executados após merge</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {data.effectiveSteps.map((s) => (
                <li key={s.id}>{s.description ?? s.id}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
