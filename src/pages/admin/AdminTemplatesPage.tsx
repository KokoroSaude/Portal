import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { AdminMessageTemplate } from "@/types/api";

const TONES = [
  { value: "acolhedor", label: "Acolhedor" },
  { value: "motivacional", label: "Motivacional" },
  { value: "direto", label: "Direto" },
] as const;

function toneLabel(tone: string) {
  return TONES.find((t) => t.value === tone)?.label ?? tone;
}

export function AdminTemplatesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tone, setTone] = useState<string>("acolhedor");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => api.adminListTemplates(token!),
    enabled: !!token,
  });

  const byTone = useMemo(
    () => data?.filter((t) => t.tone === tone) ?? [],
    [data, tone],
  );

  const selected = useMemo(
    () => data?.find((t) => t.templateKey === selectedKey) ?? null,
    [data, selectedKey],
  );

  const filtered = byTone.filter(
    (t) =>
      !filter ||
      t.baseKey.toLowerCase().includes(filter.toLowerCase()) ||
      t.templateKey.toLowerCase().includes(filter.toLowerCase()) ||
      (t.description?.toLowerCase().includes(filter.toLowerCase()) ?? false),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpsertTemplate(token!, selectedKey!, content, description || undefined, selected?.locale),
    onSuccess: () => {
      toast.success("Mensagem padrão salva");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const resetMutation = useMutation({
    mutationFn: (t: AdminMessageTemplate) =>
      api.adminResetTemplate(token!, t.templateKey, t.locale),
    onSuccess: () => {
      toast.success("Mensagem restaurada ao padrão embutido");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao resetar"),
  });

  function selectTemplate(t: AdminMessageTemplate) {
    setSelectedKey(t.templateKey);
    setContent(t.content);
    setDescription(t.description ?? "");
  }

  function handleToneChange(next: string) {
    setTone(next);
    setSelectedKey(null);
    setContent("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens padrão"
        description="Edite os textos globais usados por todos os tenants (por tom de voz)."
      />

      <Tabs value={tone} onValueChange={handleToneChange}>
        <TabsList>
          {TONES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Catálogo · {toneLabel(tone)}</CardTitle>
              <Input
                placeholder="Filtrar…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
              {filtered.map((t) => (
                <button
                  key={t.templateKey}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    selectedKey === t.templateKey ? "bg-muted font-medium" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs">{t.baseKey}</span>
                    {t.isCustomized && <Badge variant="secondary">Editado</Badge>}
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
              <CardTitle className="font-mono text-base">
                {selected ? selected.baseKey : "Selecione uma mensagem"}
              </CardTitle>
              <CardDescription>
                Tom: {toneLabel(tone)}. Variáveis: {"{nome}"}, {"{medicamento}"}, {"{horario}"},{" "}
                {"{saudacao}"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Descrição (opcional)</Label>
                    <Input
                      id="desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                      <Save className="size-4" />
                      Salvar
                    </Button>
                    {selected.isCustomized && (
                      <Button
                        variant="outline"
                        onClick={() => resetMutation.mutate(selected)}
                        disabled={resetMutation.isPending}
                      >
                        <RotateCcw className="size-4" />
                        Restaurar padrão
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chave: <span className="font-mono">{selected.templateKey}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione uma mensagem à esquerda para editar o texto padrão da plataforma.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
