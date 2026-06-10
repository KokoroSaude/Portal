import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { MORISKY_LEVEL_LABELS } from "@/lib/constants";
import type { MoriskyQuestionDefinition, MoriskyScaleDefinition } from "@/types/api";

function sortQuestions(questions: MoriskyQuestionDefinition[]) {
  return [...questions].sort((a, b) => a.order - b.order);
}

export function MoriskyScalePage() {
  const { token, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [scale, setScale] = useState<MoriskyScaleDefinition | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["morisky-scale"],
    queryFn: () => api.getMoriskyScale(token!),
    enabled: !!token && isAdmin,
  });

  useEffect(() => {
    if (data) {
      const next = structuredClone(data.effectiveScale);
      setScale(next);
      setSelectedQuestionId((current) => current ?? next.questions[0]?.id ?? null);
    }
  }, [data]);

  const isCustomized = !!data?.tenantScale;
  const sortedQuestions = useMemo(
    () => (scale ? sortQuestions(scale.questions) : []),
    [scale],
  );
  const selectedQuestion = sortedQuestions.find((q) => q.id === selectedQuestionId) ?? null;
  const selectedIndex = selectedQuestion
    ? sortedQuestions.findIndex((q) => q.id === selectedQuestion.id)
    : -1;

  const saveMutation = useMutation({
    mutationFn: () => api.updateMoriskyScale(token!, scale!),
    onSuccess: () => {
      toast.success("Escala Morisky salva");
      queryClient.invalidateQueries({ queryKey: ["morisky-scale"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.resetMoriskyScale(token!),
    onSuccess: () => {
      toast.success("Escala restaurada ao padrão MMAS-8");
      queryClient.invalidateQueries({ queryKey: ["morisky-scale"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao resetar"),
  });

  function updateScale(patch: Partial<MoriskyScaleDefinition>) {
    setScale((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function updateQuestion(id: string, patch: Partial<MoriskyQuestionDefinition>) {
    setScale((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
          }
        : prev,
    );
  }

  function moveQuestion(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sortedQuestions.length) return;
    const reordered = [...sortedQuestions];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const withOrder = reordered.map((q, i) => ({ ...q, order: i + 1 }));
    updateScale({ questions: withOrder });
  }

  function updateLevel(index: number, field: "minScore" | "maxScore", value: number) {
    setScale((prev) =>
      prev
        ? {
            ...prev,
            levels: prev.levels.map((level, i) =>
              i === index ? { ...level, [field]: value } : level,
            ),
          }
        : prev,
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Link
          to="/configuracoes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Configurações
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Apenas administradores podem editar a escala Morisky.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading || !scale) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escala Morisky (MMAS)"
        description="Perguntas, pontuação e mensagens da avaliação de adesão medicamentosa via WhatsApp."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/configuracoes?tab=morisky">
                <ArrowLeft className="size-4" />
                Voltar às configurações
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending || !isCustomized}
            >
              <RotateCcw className="size-4" />
              Restaurar padrão
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="size-4" />
              {saveMutation.isPending ? "Salvando…" : "Salvar escala"}
            </Button>
          </div>
        }
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            A escala efetiva combina o padrão MMAS-8 com personalizações da organização.{" "}
            {isCustomized ? (
              <>
                <Badge variant="secondary" className="ml-1">
                  Personalizada
                </Badge>{" "}
                — perguntas desabilitadas não entram no score máximo.
              </>
            ) : (
              "Você está usando o padrão MMAS-8 sem alterações."
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perguntas</CardTitle>
            <CardDescription>Ordem enviada ao paciente no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {sortedQuestions.map((question, index) => {
                const isSelected = selectedQuestionId === question.id;
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedQuestionId(question.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors hover:bg-muted/60 ${
                        isSelected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : ""
                      }`}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="line-clamp-2 font-medium leading-snug">{question.text}</p>
                          {!question.enabled && (
                            <Badge variant="outline" className="text-[10px]">
                              Desativada
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {question.yesScoresPoint ? "Sim = 1 pt" : "Não = 1 pt"}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedQuestion ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Editar pergunta {selectedIndex + 1}</CardTitle>
                <CardDescription>Texto e regra de pontuação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveQuestion(selectedIndex, -1)}
                    disabled={selectedIndex <= 0}
                  >
                    <ArrowUp className="size-4" />
                    Subir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveQuestion(selectedIndex, 1)}
                    disabled={selectedIndex >= sortedQuestions.length - 1}
                  >
                    <ArrowDown className="size-4" />
                    Descer
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="question-enabled">Pergunta ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Perguntas desativadas não são enviadas nem pontuadas.
                    </p>
                  </div>
                  <Switch
                    id="question-enabled"
                    checked={selectedQuestion.enabled}
                    onCheckedChange={(checked) =>
                      updateQuestion(selectedQuestion.id, { enabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-text">Texto da pergunta</Label>
                  <Textarea
                    id="question-text"
                    rows={3}
                    value={selectedQuestion.text}
                    onChange={(e) => updateQuestion(selectedQuestion.id, { text: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pontuação</Label>
                  <Select
                    value={selectedQuestion.yesScoresPoint ? "yes" : "no"}
                    onValueChange={(v) =>
                      updateQuestion(selectedQuestion.id, { yesScoresPoint: v === "yes" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Resposta &quot;Não&quot; soma 1 ponto</SelectItem>
                      <SelectItem value="yes">Resposta &quot;Sim&quot; soma 1 ponto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Selecione uma pergunta para editar.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensagens do fluxo</CardTitle>
              <CardDescription>Introdução, validação e encerramento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intro-text">Introdução</Label>
                <Textarea
                  id="intro-text"
                  rows={3}
                  value={scale.introText}
                  onChange={(e) => updateScale({ introText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invalid-text">Resposta inválida</Label>
                <Textarea
                  id="invalid-text"
                  rows={2}
                  value={scale.invalidText}
                  onChange={(e) => updateScale({ invalidText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thankyou-text">Agradecimento</Label>
                <Textarea
                  id="thankyou-text"
                  rows={2}
                  value={scale.thankYouText}
                  onChange={(e) => updateScale({ thankYouText: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faixas de classificação</CardTitle>
              <CardDescription>Níveis de adesão conforme score total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scale.levels.map((level, index) => (
                <div
                  key={level.level}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_6rem_6rem]"
                >
                  <div>
                    <p className="font-medium">{MORISKY_LEVEL_LABELS[level.level] ?? level.level}</p>
                    <p className="text-xs text-muted-foreground">Código: {level.level}</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`min-${level.level}`}>Mín.</Label>
                    <Input
                      id={`min-${level.level}`}
                      type="number"
                      min={0}
                      value={level.minScore}
                      onChange={(e) => updateLevel(index, "minScore", Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`max-${level.level}`}>Máx.</Label>
                    <Input
                      id={`max-${level.level}`}
                      type="number"
                      min={0}
                      value={level.maxScore}
                      onChange={(e) => updateLevel(index, "maxScore", Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
