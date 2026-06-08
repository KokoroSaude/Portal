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
      }),
    onSuccess: () => {
      toast.success("Provedor de IA atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-platform-ai"] });
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
          Troque entre Claude e GPT sem redeploy. As chaves ficam no Railway (variáveis de ambiente).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={data?.openAiConfigured ? "default" : "secondary"}>
            OpenAI {data?.openAiConfigured ? "configurada" : "sem chave"}
          </Badge>
          <Badge variant={data?.anthropicConfigured ? "default" : "secondary"}>
            Anthropic {data?.anthropicConfigured ? "configurada" : "sem chave"}
          </Badge>
          {data && (
            <Badge variant={data.isConfigured ? "success" : "warning"}>
              {data.isConfigured ? "Pronta para uso" : "Chave do provedor ativo ausente"}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provedor</Label>
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
            <p className="text-xs text-muted-foreground">
              Padrão: {effectiveModel || DEFAULT_MODELS[provider]}
            </p>
          </div>
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading}>
          {saveMutation.isPending ? "Salvando…" : "Salvar provedor"}
        </Button>
      </CardContent>
    </Card>
  );
}
