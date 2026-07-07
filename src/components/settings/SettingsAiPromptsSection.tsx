import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
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
];

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

function resolveAudience(prompt: PatientAiPrompt): PromptAudience {
  if (prompt.audience === "patient" || prompt.audience === "operator") return prompt.audience;
  return "patient";
}

function PromptCard({
  prompt,
  editable,
  onSave,
  onReset,
  saving,
}: {
  prompt: PatientAiPrompt;
  editable: boolean;
  onSave: (id: string, text: string) => void;
  onReset: (id: string) => void;
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
              {audience === "operator"
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
                  Salvar override
                </Button>
                {prompt.isOverridden || prompt.defaultSystemPrompt ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      onReset(prompt.id);
                      setDraft(prompt.defaultSystemPrompt ?? prompt.systemPrompt);
                    }}
                  >
                    Restaurar padrão
                  </Button>
                ) : null}
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
        {prompt.notes && prompt.notes.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {prompt.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}

function PromptAudiencePanel({
  prompts,
  editable,
  saving,
  onSave,
  onReset,
}: {
  prompts: PatientAiPrompt[];
  editable: boolean;
  saving: boolean;
  onSave: (id: string, text: string) => void;
  onReset: (id: string) => void;
}) {
  const outbound = prompts.filter((p) => p.category === "texto_outbound");
  const copilot = prompts.filter((p) => p.category === "copilot_portal");
  const other = prompts.filter(
    (p) => p.category !== "texto_outbound" && p.category !== "copilot_portal",
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
              saving={saving}
              onSave={onSave}
              onReset={onReset}
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
              saving={saving}
              onSave={onSave}
              onReset={onReset}
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
              saving={saving}
              onSave={onSave}
              onReset={onReset}
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
  const onReset = (id: string) => saveMutation.mutate({ id, text: null });

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">
            {editable ? "Prompts editáveis (plataforma)" : "Referência dos prompts"}
          </CardTitle>
          <CardDescription>
            {editable
              ? "Overrides de system prompt aplicam-se a todos os tenants. Use as abas para separar WhatsApp (paciente) e copilot (equipe)."
              : "Textos enviados ao LLM quando a IA está ativa — paciente no WhatsApp e equipe no portal."}
          </CardDescription>
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
              saving={saveMutation.isPending}
              onSave={onSave}
              onReset={onReset}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
