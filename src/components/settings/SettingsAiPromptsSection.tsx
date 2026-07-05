import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { PatientAiPrompt } from "@/types/api";

const CATEGORY_LABELS: Record<string, string> = {
  texto_outbound: "Texto enviado ao paciente",
  classificacao_inbound: "Classificação (não enviada)",
  extracao_dados: "Extração de dados (não enviada)",
};

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

function PromptCard({ prompt }: { prompt: PatientAiPrompt }) {
  return (
    <details className="group rounded-lg border mb-3 last:mb-0 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium text-sm">{prompt.title}</span>
          <div className="flex flex-wrap gap-2">
            <Badge variant={prompt.sendsToPatient ? "default" : "secondary"}>
              {prompt.sendsToPatient ? "Vai ao paciente" : "Só backend"}
            </Badge>
            <Badge variant="outline">{prompt.aiUseCaseLabel}</Badge>
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
          <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap font-mono">
            {prompt.systemPrompt}
          </pre>
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

type Props = {
  /** tenant = /api/settings/ai/prompts · platform = /api/admin/platform/ai/prompts */
  scope?: "tenant" | "platform";
};

export function SettingsAiPromptsSection({ scope = "tenant" }: Props) {
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-ai-prompts", scope],
    queryFn: () =>
      scope === "platform"
        ? api.adminGetPatientAiPrompts(token!)
        : api.getPatientAiPrompts(token!),
    enabled: Boolean(token),
  });

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

  const outbound = data.filter((p) => p.category === "texto_outbound");
  const other = data.filter((p) => p.category !== "texto_outbound");

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Referência dos prompts</CardTitle>
          <CardDescription>
            Textos exatos enviados ao LLM quando a IA está ativa. Onboarding, Morisky e TCP usam os
            prompts de personalização ou guidance conforme o modo inbound configurado em Conversação.
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">{categoryLabel("texto_outbound")}</h3>
        {outbound.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
      </section>

      {other.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Classificação e extração</h3>
          <p className="text-sm text-muted-foreground">
            Estes prompts interpretam a mensagem do paciente; o texto retornado não é enviado
            diretamente (exceto quando dispara um template).
          </p>
          {other.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
