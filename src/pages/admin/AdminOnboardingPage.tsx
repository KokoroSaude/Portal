import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, MessageSquareText, Play } from "lucide-react";
import { AdminTemplateEditorPanel } from "@/components/admin/AdminTemplateEditorPanel";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_TEMPLATE_TONES, adminTemplateToneLabel } from "@/lib/adminTemplateTones";
import { api, ApiClientError } from "@/lib/api";
import { JOURNEY_STEP_TYPE_LABELS } from "@/lib/constants";
import type { AdminMessageTemplate } from "@/types/api";

function stepTypeLabel(type: string) {
  return JOURNEY_STEP_TYPE_LABELS[type] ?? type;
}

function findByBaseAndTone(items: AdminMessageTemplate[], baseKey: string, tone: string) {
  return items.find((t) => t.baseKey === baseKey && t.tone === tone) ?? null;
}

export function AdminOnboardingPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tone, setTone] = useState("acolhedor");
  const [selectedBaseKey, setSelectedBaseKey] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => api.adminListTemplates(token!),
    enabled: !!token,
  });

  const { data: onboardingFlow, isLoading: flowLoading } = useQuery({
    queryKey: ["admin-onboarding-flow"],
    queryFn: () => api.adminGetOnboardingFlow(token!),
    enabled: !!token,
  });

  const onboardingTemplates = useMemo(
    () => templates?.filter((t) => t.tone === tone && t.category === "onboarding") ?? [],
    [templates, tone],
  );

  const selected = useMemo(() => {
    if (!selectedBaseKey) return null;
    return findByBaseAndTone(templates ?? [], selectedBaseKey, tone);
  }, [templates, selectedBaseKey, tone]);

  useEffect(() => {
    if (!onboardingFlow?.steps.length || selectedBaseKey) return;
    setSelectedBaseKey(onboardingFlow.steps[0].templateKey);
  }, [onboardingFlow, selectedBaseKey]);

  useEffect(() => {
    if (selected) {
      setContent(selected.content);
      setDescription(selected.description ?? "");
    }
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpsertTemplate(token!, selected!.templateKey, content, description || undefined, selected?.locale),
    onSuccess: () => {
      toast.success("Mensagem do onboarding salva");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.adminResetTemplate(token!, selected!.templateKey, selected!.locale),
    onSuccess: () => {
      toast.success("Mensagem restaurada ao padrão");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao resetar"),
  });

  function selectStep(baseKey: string) {
    setSelectedBaseKey(baseKey);
    const template = findByBaseAndTone(templates ?? [], baseKey, tone);
    if (template) {
      setContent(template.content);
      setDescription(template.description ?? "");
    }
  }

  function handleToneChange(next: string) {
    setTone(next);
    if (selectedBaseKey) {
      const nextTemplate = findByBaseAndTone(templates ?? [], selectedBaseKey, next);
      if (nextTemplate) {
        setContent(nextTemplate.content);
        setDescription(nextTemplate.description ?? "");
      }
    }
  }

  const loading = templatesLoading || flowLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding WhatsApp"
        description="Fluxo que o paciente novo percorre no WhatsApp: boas-vindas, coleta de dados e ativação."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to={`/admin/simulador?mode=onboarding&tone=${encodeURIComponent(tone)}`}>
                <Play className="size-4" />
                Testar no simulador
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/mensagens">
                <MessageSquareText className="size-4" />
                Lembretes e demais mensagens
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            Edite cada passo na ordem em que o paciente recebe. Use as abas de <strong>tom de voz</strong>{" "}
            para personalizar acolhedor, motivacional ou direto. Valide no{" "}
            <Link to="/admin/simulador" className="font-medium text-primary underline-offset-2 hover:underline">
              simulador WhatsApp
            </Link>{" "}
            respondendo como paciente — sem formulário de dados fictícios.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tone} onValueChange={handleToneChange}>
        <TabsList>
          {ADMIN_TEMPLATE_TONES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-[32rem] w-full" />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Passos do fluxo</CardTitle>
                <CardDescription>
                  Ordem enviada ao paciente · tom {adminTemplateToneLabel(tone).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {onboardingFlow?.steps.map((step, index) => {
                    const template = findByBaseAndTone(templates ?? [], step.templateKey, tone);
                    const isSelected = selectedBaseKey === step.templateKey;

                    return (
                      <li key={step.id}>
                        <button
                          type="button"
                          onClick={() => selectStep(step.templateKey)}
                          className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors hover:bg-muted/60 ${
                            isSelected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : ""
                          }`}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium leading-snug">{step.description}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {stepTypeLabel(step.type)}
                              </Badge>
                              {template?.isCustomized && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Editado
                                </Badge>
                              )}
                            </div>
                            {template && (
                              <p className="line-clamp-2 text-xs text-muted-foreground">{template.content}</p>
                            )}
                          </div>
                          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>

            {onboardingFlow && onboardingFlow.systemMessages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Respostas automáticas</CardTitle>
                  <CardDescription>
                    Mensagens de erro, confirmação e situações especiais durante o fluxo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {onboardingFlow.systemMessages.map((msg) => {
                    const template = findByBaseAndTone(templates ?? [], msg.templateKey, tone);
                    const isSelected = selectedBaseKey === msg.templateKey;

                    return (
                      <button
                        key={msg.templateKey}
                        type="button"
                        onClick={() => selectStep(msg.templateKey)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                          isSelected ? "border-primary/40 bg-primary/5" : ""
                        }`}
                      >
                        <span className="font-medium">{msg.description}</span>
                        {template?.isCustomized && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Editado
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          <AdminTemplateEditorPanel
            tone={tone}
            selected={selected}
            content={content}
            description={description}
            onContentChange={setContent}
            onDescriptionChange={setDescription}
            onSave={() => saveMutation.mutate()}
            onReset={() => resetMutation.mutate()}
            savePending={saveMutation.isPending}
            resetPending={resetMutation.isPending}
            emptyTitle="Selecione um passo"
            emptyDescription="Clique em um passo do fluxo ou em uma resposta automática para editar o texto."
          />
        </div>
      )}

      {onboardingTemplates.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {onboardingTemplates.filter((t) => t.isCustomized).length} de {onboardingTemplates.length} mensagens
          de onboarding personalizadas neste tom.
        </p>
      )}
    </div>
  );
}
