import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { WhatsAppMessagePreview } from "@/components/messages/WhatsAppMessagePreview";
import { PageHeader } from "@/components/PageHeader";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { FeatureLocked } from "@/components/PageHeader";

export function TemplatesPage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.getTemplates(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.templatesCustomRead),
  });

  const selected = useMemo(
    () => data?.find((t) => t.templateKey === selectedKey) ?? null,
    [data, selectedKey],
  );

  const canWrite = hasFeature(FEATURE_KEYS.templatesCustomWrite);
  const canReset = hasFeature(FEATURE_KEYS.templatesCustomReset);

  const saveMutation = useMutation({
    mutationFn: () => api.upsertTemplate(token!, selectedKey!, content, description || undefined),
    onSuccess: () => {
      toast.success("Template salvo");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => api.resetTemplate(token!, key),
    onSuccess: () => {
      toast.success("Template restaurado ao padrão");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      if (selected) {
        setContent(selected.content);
      }
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao resetar"),
  });

  if (!hasFeature(FEATURE_KEYS.templatesCustomRead)) {
    return (
      <>
        <PageHeader title="Templates" description="Personalize mensagens automáticas" />
        <FeatureLocked
          title="Templates não disponíveis"
          description="Faça upgrade para visualizar e editar templates do tenant."
        />
      </>
    );
  }

  const filtered = data?.filter(
    (t) =>
      !filter ||
      t.templateKey.toLowerCase().includes(filter.toLowerCase()) ||
      (t.description?.toLowerCase().includes(filter.toLowerCase()) ?? false),
  );

  function selectTemplate(key: string) {
    const t = data?.find((x) => x.templateKey === key);
    setSelectedKey(key);
    setContent(t?.content ?? "");
    setDescription(t?.description ?? "");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Templates" description="Personalize mensagens automáticas do WhatsApp" />

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="text-base">Catálogo</CardTitle>
              <GridSearchBar
                value={filter}
                onChange={setFilter}
                placeholder="Buscar por chave ou descrição"
                resultCount={filtered?.length}
                totalCount={data?.length}
              />
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
              {filtered?.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {filter.trim() ? "Nenhum template corresponde à busca." : "Nenhum template."}
                </p>
              )}
              {filtered?.map((t) => (
                <button
                  key={t.templateKey}
                  type="button"
                  onClick={() => selectTemplate(t.templateKey)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    selectedKey === t.templateKey ? "bg-muted font-medium" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs">{t.templateKey}</span>
                    {t.isCustom && <Badge variant="secondary">Custom</Badge>}
                  </div>
                  {t.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.description}</p>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">{selectedKey ?? "Selecione um template"}</CardTitle>
              <CardDescription>
                Use variáveis como {"{nome}"}, {"{medicamento}"}, {"{horario}"}, {"{saudacao}"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedKey ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição (opcional)</Label>
                    <Input
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!canWrite}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={!canWrite}
                    />
                  </div>
                  <WhatsAppMessagePreview content={content} />
                  <div className="flex gap-2">
                    {canWrite && (
                      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        <Save className="size-4" />
                        Salvar
                      </Button>
                    )}
                    {canReset && selected?.isCustom && (
                      <Button
                        variant="outline"
                        onClick={() => resetMutation.mutate(selectedKey)}
                        disabled={resetMutation.isPending}
                      >
                        <RotateCcw className="size-4" />
                        Restaurar padrão
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um template à esquerda.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
