import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <AccordionItem value={prompt.id} className="border rounded-lg px-4 mb-3 last:mb-0">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-3">
          <span className="font-medium">{prompt.title}</span>
          <div className="flex flex-wrap gap-2">
            <Badge variant={prompt.sendsToPatient ? "default" : "secondary"}>
              {prompt.sendsToPatient ? "Vai ao paciente" : "Só backend"}
            </Badge>
            <Badge variant="outline">{prompt.aiUseCaseLabel}</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pb-4 text-sm">
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
      </AccordionContent>
    </AccordionItem>
  );
}

export function SettingsAiPromptsSection() {
  const { token } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-ai-prompts"],
    queryFn: () => api.getPatientAiPrompts(token!),
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
        <Accordion type="multiple" className="space-y-0">
          {outbound.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </Accordion>
      </section>

      {other.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Classificação e extração</h3>
          <p className="text-sm text-muted-foreground">
            Estes prompts interpretam a mensagem do paciente; o texto retornado não é enviado
            diretamente (exceto quando dispara um template).
          </p>
          <Accordion type="multiple" className="space-y-0">
            {other.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </Accordion>
        </section>
      ) : null}
    </div>
  );
}
