import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PlatformAiUseCaseRoute } from "@/types/api";

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

const USE_CASE_META: Record<string, string> = {
  whatsapp: "WhatsApp (intents, onboarding, medicamentos)",
  prescription_vision: "Receita (PDF/imagem)",
  insights: "Insights e copilot",
  outbound: "Personalização de mensagens",
  milestone: "Personalização de marcos",
};

const DEFAULT_USE_CASE_ROUTES: PlatformAiUseCaseRoute[] = [
  { key: "whatsapp", provider: null, model: null },
  { key: "prescription_vision", provider: null, model: null },
  { key: "insights", provider: null, model: null },
  { key: "outbound", provider: null, model: null },
  { key: "milestone", provider: null, model: null },
];

function ProviderStatus({
  name,
  configured,
  hint,
  loading,
}: {
  name: string;
  configured?: boolean;
  hint?: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        configured ? "border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20" : "bg-muted/30",
      )}
    >
      <div className="flex items-center gap-2">
        {configured ? (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Circle className="size-4 shrink-0 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{name}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {configured ? hint ? `Chave · ${hint}` : "Chave configurada" : "Sem chave"}
      </p>
    </div>
  );
}

export function AdminPlatformAiCard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [useCaseRoutes, setUseCaseRoutes] = useState<PlatformAiUseCaseRoute[]>(DEFAULT_USE_CASE_ROUTES);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-ai"],
    queryFn: () => api.adminGetPlatformAi(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (!data) return;
    setProvider(data.provider);
    setModel(data.model === DEFAULT_MODELS[data.provider] ? "" : data.model);
    if (data.useCaseRoutes?.length) {
      setUseCaseRoutes(
        DEFAULT_USE_CASE_ROUTES.map((defaults) => {
          const saved = data.useCaseRoutes.find((r) => r.key === defaults.key);
          return saved ?? defaults;
        }),
      );
    }
  }, [data]);

  const updateRoute = (key: string, patch: Partial<PlatformAiUseCaseRoute>) => {
    setUseCaseRoutes((routes) =>
      routes.map((route) => (route.key === key ? { ...route, ...patch } : route)),
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpdatePlatformAi(token!, {
        provider,
        model: model.trim() || null,
        openAiApiKey: openAiApiKey.trim() || null,
        anthropicApiKey: anthropicApiKey.trim() || null,
        geminiApiKey: geminiApiKey.trim() || null,
        groqApiKey: groqApiKey.trim() || null,
        updateOpenAiApiKey: openAiApiKey.trim().length > 0,
        updateAnthropicApiKey: anthropicApiKey.trim().length > 0,
        updateGeminiApiKey: geminiApiKey.trim().length > 0,
        updateGroqApiKey: groqApiKey.trim().length > 0,
        useCaseRoutes: useCaseRoutes.map((route) => ({
          key: route.key,
          provider: route.provider || null,
          model: route.model?.trim() || null,
        })),
      }),
    onSuccess: () => {
      toast.success("Configuração de IA salva");
      setOpenAiApiKey("");
      setAnthropicApiKey("");
      setGeminiApiKey("");
      setGroqApiKey("");
      queryClient.invalidateQueries({ queryKey: ["admin-platform-ai"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const testMutation = useMutation({
    mutationFn: () => api.adminTestPlatformAi(token!),
    onSuccess: (result) => {
      if (result.parsedOk) {
        toast.success(result.message ?? "Conexão com LLM ok.");
        return;
      }
      toast.error(result.error ?? "Teste de IA falhou.");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao testar IA"),
  });

  const testVisionMutation = useMutation({
    mutationFn: () => api.adminTestPlatformAiVision(token!),
    onSuccess: (result) => {
      if (result.parsedOk) {
        toast.success(result.message ?? "Visão de receita OK.");
        return;
      }
      toast.error(result.error ?? "Teste de visão falhou.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao testar visão"),
  });

  const visionRouteProvider =
    useCaseRoutes.find((r) => r.key === "prescription_vision")?.provider ?? provider;
  const visionKeyReady =
    visionRouteProvider === "gemini"
      ? data?.geminiConfigured
      : visionRouteProvider === "openai"
        ? data?.openAiConfigured
        : visionRouteProvider === "anthropic"
          ? data?.anthropicConfigured
          : visionRouteProvider === "groq"
            ? data?.groqConfigured
            : data?.isConfigured;

  const effectiveModel = model.trim() || DEFAULT_MODELS[provider] || "";
  const savePending = saveMutation.isPending || isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Status dos provedores
          </CardTitle>
          <CardDescription>
            Chaves criptografadas no banco. Fallback: variáveis de ambiente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ProviderStatus
              name="Gemini"
              configured={data?.geminiConfigured}
              hint={data?.geminiKeyHint}
              loading={isLoading}
            />
            <ProviderStatus
              name="Groq"
              configured={data?.groqConfigured}
              hint={data?.groqKeyHint}
              loading={isLoading}
            />
            <ProviderStatus
              name="Anthropic"
              configured={data?.anthropicConfigured}
              hint={data?.anthropicKeyHint}
              loading={isLoading}
            />
            <ProviderStatus
              name="OpenAI"
              configured={data?.openAiConfigured}
              hint={data?.openAiKeyHint}
              loading={isLoading}
            />
          </div>
          {!isLoading && data && (
            <Badge variant={data.isConfigured ? "success" : "warning"}>
              {data.isConfigured ? "Padrão global pronto" : "Falta chave do provedor padrão"}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Provedor padrão</CardTitle>
            <CardDescription>
              Usado quando um use case não define provedor próprio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label>Provedor (fallback)</Label>
              <Select value={provider} onValueChange={setProvider} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini (Google — tier gratuito)</SelectItem>
                  <SelectItem value="groq">Llama via Groq (tier gratuito)</SelectItem>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chaves de API</CardTitle>
            <CardDescription>
              Deixe em branco para manter a chave atual. Preencha só ao cadastrar ou trocar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini (Google AI Studio)</Label>
              <Input
                id="gemini-key"
                type="password"
                autoComplete="off"
                placeholder={data?.geminiKeyHint ? `Salva: ${data.geminiKeyHint}` : "Cole a nova chave"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groq-key">Groq (gsk_…)</Label>
              <Input
                id="groq-key"
                type="password"
                autoComplete="off"
                placeholder={data?.groqKeyHint ? `Salva: ${data.groqKeyHint}` : "Cole a nova chave"}
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic (sk-ant-…)</Label>
              <Input
                id="anthropic-key"
                type="password"
                autoComplete="off"
                placeholder={
                  data?.anthropicKeyHint ? `Salva: ${data.anthropicKeyHint}` : "Cole a nova chave"
                }
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Roteamento por funcionalidade</CardTitle>
          <CardDescription>
            Ex.: Groq no WhatsApp + Gemini grátis só na receita. Provedor vazio usa o padrão global.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionalidade</TableHead>
                <TableHead className="w-[200px]">Provedor</TableHead>
                <TableHead className="w-[220px]">Modelo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {useCaseRoutes.map((route) => (
                <TableRow key={route.key}>
                  <TableCell className="font-medium">
                    {USE_CASE_META[route.key] ?? route.key}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={route.provider ?? "default"}
                      onValueChange={(v) =>
                        updateRoute(route.key, { provider: v === "default" ? null : v })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Padrão global</SelectItem>
                        <SelectItem value="gemini">Gemini</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-9"
                      placeholder={
                        route.provider ? DEFAULT_MODELS[route.provider] : "Modelo do padrão global"
                      }
                      value={route.model ?? ""}
                      onChange={(e) => updateRoute(route.key, { model: e.target.value || null })}
                      disabled={isLoading}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-muted/20">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={savePending}>
              {saveMutation.isPending ? "Salvando…" : "Salvar configuração"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || isLoading || !data?.isConfigured}
            >
              {testMutation.isPending ? "Testando…" : "Testar insights (LLM)"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => testVisionMutation.mutate()}
              disabled={testVisionMutation.isPending || isLoading || !visionKeyReady}
            >
              {testVisionMutation.isPending ? "Testando…" : "Testar receita (visão)"}
            </Button>
          </div>
          {!visionKeyReady && (
            <p className="text-sm text-muted-foreground">
              Para testar receita, configure o provedor de{" "}
              <strong>{USE_CASE_META.prescription_vision}</strong>
              {visionRouteProvider !== provider ? ` (${visionRouteProvider})` : ""} com chave válida
              {visionRouteProvider === "groq" || visionRouteProvider === "anthropic"
                ? " — use Gemini ou OpenAI para visão."
                : "."}
            </p>
          )}
          {!data?.isConfigured && !isLoading && (
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Configure pelo menos o provedor padrão com a chave correspondente. Use o roteamento
              acima para funcionalidades específicas (ex.: receita com Gemini grátis).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
