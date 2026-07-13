import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { PatientAiPrompt } from "@/types/api";

type PromptAudience = PatientAiPrompt["audience"];

const CATEGORY_LABELS: Record<string, string> = {
  texto_outbound: "Texto enviado ao paciente",
  classificacao_inbound: "Classificação (não enviada)",
  extracao_dados: "Extração de dados (não enviada)",
  copilot_portal: "Copilot no portal",
  relatorios_ia: "Insights de relatórios",
};

const AUDIENCE_TABS: {
  value: PromptAudience;
  label: string;
  description: string;
}[] = [
  {
    value: "patient",
    label: "Paciente (WhatsApp)",
    description: "Onboarding, escalas, lembretes, receitas e mensagens outbound.",
  },
  {
    value: "operator",
    label: "Operação (portal)",
    description: "Resumo do paciente e sugestões do Assistente Kokoro em /assistente-ia.",
  },
  {
    value: "reports",
    label: "Relatórios",
    description: "Insights IA dos relatórios (adesão, engajamento, escalas) e resumo da avaliação estratégica.",
  },
];

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

function downloadJsonFile(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportAllPrompts(prompts: PatientAiPrompt[]) {
  const exportedAt = new Date().toISOString();
  const payload = {
    exportedAt,
    promptCount: prompts.length,
    prompts: prompts.map((prompt) => ({
      id: prompt.id,
      title: prompt.title,
      audience: resolveAudience(prompt),
      category: prompt.category,
      aiUseCaseKey: prompt.aiUseCaseKey,
      aiUseCaseLabel: prompt.aiUseCaseLabel,
      sendsToPatient: prompt.sendsToPatient,
      whenUsed: prompt.whenUsed,
      systemPrompt: prompt.systemPrompt,
      defaultSystemPrompt: prompt.defaultSystemPrompt ?? null,
      isOverridden: prompt.isOverridden ?? false,
      userPayloadDescription: prompt.userPayloadDescription,
      notes: prompt.notes ?? [],
    })),
  };

  const date = exportedAt.slice(0, 10);
  downloadJsonFile(`kokoro-prompts-ia-${date}.json`, payload);
  toast.success(`${prompts.length} prompts exportados`);
}

function resolveAudience(prompt: PatientAiPrompt): PromptAudience {
  if (prompt.audience === "patient" || prompt.audience === "operator" || prompt.audience === "reports")
    return prompt.audience;
  if (prompt.category === "relatorios_ia" || prompt.id.startsWith("report_insight_"))
    return "reports";
  return "patient";
}

function PromptCard({
  prompt,
  editable,
  showNotes,
  onSave,
  saving,
}: {
  prompt: PatientAiPrompt;
  editable: boolean;
  showNotes: boolean;
  onSave: (id: string, text: string) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(prompt.systemPrompt);
  const dirty = draft !== prompt.systemPrompt;
  const audience = resolveAudience(prompt);

  return (
    <details className="group rounded-lg border mb-3 last:mb-0 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium text-sm">{prompt.title}</span>
          <div className="flex flex-wrap gap-2">
            <Badge variant={audience === "patient" && prompt.sendsToPatient ? "default" : "secondary"}>
              {audience === "reports"
                ? "Relatórios / equipe"
                : audience === "operator"
                  ? "Equipe / portal"
                  : prompt.sendsToPatient
                    ? "Vai ao paciente"
                    : "Só backend"}
            </Badge>
            <Badge variant="outline">{prompt.aiUseCaseLabel}</Badge>
            {prompt.isOverridden ? <Badge variant="secondary">Customizado</Badge> : null}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180",
          )}
        />
      </summary>
      <div className="space-y-4 border-t px-4 pb-4 pt-3 text-sm">
        <div>
          <p className="font-medium text-foreground">Quando usa</p>
          <p className="text-muted-foreground mt-1">{prompt.whenUsed}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">System prompt</p>
          {editable ? (
            <div className="mt-2 space-y-2">
              <Textarea
                className="min-h-48 font-mono text-xs"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={!dirty || saving || draft.trim().length === 0}
                  onClick={() => onSave(prompt.id, draft.trim())}
                >
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
              {prompt.systemPrompt}
            </pre>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">Payload do usuário (contexto enviado ao modelo)</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{prompt.userPayloadDescription}</p>
        </div>
        {showNotes && prompt.notes && prompt.notes.length > 0 ? (
          <div>
            <p className="font-medium text-foreground">Notas da plataforma</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {prompt.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function PromptAudiencePanel({
  prompts,
  editable,
  showNotes,
  saving,
  onSave,
}: {
  prompts: PatientAiPrompt[];
  editable: boolean;
  showNotes: boolean;
  saving: boolean;
  onSave: (id: string, text: string) => void;
}) {
  const outbound = prompts.filter((p) => p.category === "texto_outbound");
  const copilot = prompts.filter((p) => p.category === "copilot_portal");
  const reports = prompts.filter((p) => p.category === "relatorios_ia");
  const other = prompts.filter(
    (p) =>
      p.category !== "texto_outbound"
      && p.category !== "copilot_portal"
      && p.category !== "relatorios_ia",
  );

  if (prompts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">Nenhum prompt nesta aba.</p>
    );
  }

  return (
    <div className="space-y-6">
      {outbound.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{categoryLabel("texto_outbound")}</h3>
          {outbound.map((prompt) => (
            <PromptCard
              key={`${prompt.id}-${prompt.isOverridden ? "custom" : "default"}`}
              prompt={prompt}
              editable={editable}
              showNotes={showNotes}
              saving={saving}
              onSave={onSave}
            />
          ))}
        </section>
      ) : null}

      {copilot.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{categoryLabel("copilot_portal")}</h3>
          {copilot.map((prompt) => (
            <PromptCard
              key={`${prompt.id}-${prompt.isOverridden ? "custom" : "default"}`}
              prompt={prompt}
              editable={editable}
              showNotes={showNotes}
              saving={saving}
              onSave={onSave}
            />
          ))}
        </section>
      ) : null}

      {reports.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{categoryLabel("relatorios_ia")}</h3>
          {reports.map((prompt) => (
            <PromptCard
              key={`${prompt.id}-${prompt.isOverridden ? "custom" : "default"}`}
              prompt={prompt}
              editable={editable}
              showNotes={showNotes}
              saving={saving}
              onSave={onSave}
            />
          ))}
        </section>
      ) : null}

      {other.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Classificação e extração</h3>
          <p className="text-sm text-muted-foreground">
            Estes prompts interpretam a mensagem do paciente; o texto retornado não é enviado
            diretamente (exceto quando dispara um template).
          </p>
          {other.map((prompt) => (
            <PromptCard
              key={`${prompt.id}-${prompt.isOverridden ? "custom" : "default"}`}
              prompt={prompt}
              editable={editable}
              showNotes={showNotes}
              saving={saving}
              onSave={onSave}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

type Props = {
  /** tenant = /api/settings/ai/prompts · platform = /api/admin/platform/ai/prompts */
  scope?: "tenant" | "platform";
};

export function SettingsAiPromptsSection({ scope = "tenant" }: Props) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const editable = scope === "platform";
  const [activeTab, setActiveTab] = useState<PromptAudience>("patient");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-ai-prompts", scope],
    queryFn: () =>
      scope === "platform"
        ? api.adminGetPatientAiPrompts(token!)
        : api.getPatientAiPrompts(token!),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string | null }) =>
      api.adminUpdatePatientAiPrompt(token!, id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-ai-prompts", scope] });
    },
  });

  const byAudience = useMemo(() => {
    const grouped: Record<PromptAudience, PatientAiPrompt[]> = {
      patient: [],
      operator: [],
      reports: [],
    };
    for (const prompt of data ?? []) {
      grouped[resolveAudience(prompt)].push(prompt);
    }
    return grouped;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Não foi possível carregar</CardTitle>
          <CardDescription>Tente recarregar a página ou verifique sua permissão.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const onSave = (id: string, text: string) => saveMutation.mutate({ id, text });

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">
              {editable ? "Prompts editáveis (plataforma)" : "Referência dos prompts"}
            </CardTitle>
            <CardDescription>
              {editable
                ? "Overrides de system prompt aplicam-se a todos os tenants. Regras de tom e tamanho ficam no texto do prompt — notas abaixo são só comportamento do Kokoro."
                : "Referência read-only dos prompts ativos na plataforma. Edição em Admin → Prompts IA."}
            </CardDescription>
          </div>
          {editable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => exportAllPrompts(data)}
            >
              <Download className="mr-2 size-4" />
              Exportar todos
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PromptAudience)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {AUDIENCE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}
              <Badge variant="secondary" className="font-normal">
                {byAudience[tab.value].length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {AUDIENCE_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">{tab.description}</p>
            <PromptAudiencePanel
              prompts={byAudience[tab.value]}
              editable={editable}
              showNotes={editable}
              saving={saveMutation.isPending}
              onSave={onSave}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
