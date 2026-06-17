import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
};

export function AdminPlatformAiCard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-ai"],
    queryFn: () => api.adminGetPlatformAi(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (!data) return;
    setProvider(data.provider);
    setModel(data.model === DEFAULT_MODELS[data.provider] ? "" : data.model);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpdatePlatformAi(token!, {
        provider,
        model: model.trim() || null,
        openAiApiKey: openAiApiKey.trim() || null,
        anthropicApiKey: anthropicApiKey.trim() || null,
        updateOpenAiApiKey: openAiApiKey.trim().length > 0,
        updateAnthropicApiKey: anthropicApiKey.trim().length > 0,
      }),
    onSuccess: () => {
      toast.success("Configuração de IA salva");
      setOpenAiApiKey("");
      setAnthropicApiKey("");
      queryClient.invalidateQueries({ queryKey: ["admin-platform-ai"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const effectiveModel = model.trim() || DEFAULT_MODELS[provider] || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Inteligência artificial
        </CardTitle>
        <CardDescription>
          Salve as chaves aqui e troque o provedor quando quiser — sem redeploy. Chaves criptografadas no
          banco (fallback: variáveis de ambiente no Railway).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={data?.openAiConfigured ? "default" : "secondary"}>
            OpenAI {data?.openAiConfigured ? "ok" : "sem chave"}
            {data?.openAiKeyHint ? ` · ${data.openAiKeyHint}` : ""}
          </Badge>
          <Badge variant={data?.anthropicConfigured ? "default" : "secondary"}>
            Anthropic {data?.anthropicConfigured ? "ok" : "sem chave"}
            {data?.anthropicKeyHint ? ` · ${data.anthropicKeyHint}` : ""}
          </Badge>
          {data && (
            <Badge variant={data.isConfigured ? "success" : "warning"}>
              {data.isConfigured ? "Provedor ativo pronto" : "Falta chave do provedor selecionado"}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provedor ativo</Label>
            <Select value={provider} onValueChange={setProvider} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                <SelectItem value="openai">GPT (OpenAI)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-model">Modelo (opcional)</Label>
            <Input
              id="ai-model"
              placeholder={DEFAULT_MODELS[provider]}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Padrão: {effectiveModel}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Chaves de API</p>
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic (sk-ant-…)</Label>
            <Input
              id="anthropic-key"
              type="password"
              autoComplete="off"
              placeholder={data?.anthropicKeyHint ? `Salva: ${data.anthropicKeyHint}` : "Cole a nova chave"}
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI (sk-…)</Label>
            <Input
              id="openai-key"
              type="password"
              autoComplete="off"
              placeholder={data?.openAiKeyHint ? `Salva: ${data.openAiKeyHint}` : "Cole a nova chave"}
              value={openAiApiKey}
              onChange={(e) => setOpenAiApiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe em branco para manter a chave atual. Preencha só ao cadastrar ou trocar.
          </p>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? "Salvando…" : "Salvar configuração"}
        </Button>
        {!data?.isConfigured && (
          <p className="text-sm text-amber-900">
            Para ativar: escolha o provedor, cole a chave correspondente no campo abaixo e salve.
            Só trocar o provedor sem colar a chave não configura o LLM.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
