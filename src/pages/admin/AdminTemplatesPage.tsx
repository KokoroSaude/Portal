import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Plus, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import {
  buildTemplateKey,
  categoryLabel,
  TEMPLATE_CATEGORIES,
  TEMPLATE_KEY_PATTERN,
  type TemplateCategoryId,
} from "@/lib/templateCatalog";
import type { AdminMessageTemplate } from "@/types/api";

const TONES = [
  { value: "acolhedor", label: "Acolhedor" },
  { value: "motivacional", label: "Motivacional" },
  { value: "direto", label: "Direto" },
] as const;

function toneLabel(tone: string) {
  return TONES.find((t) => t.value === tone)?.label ?? tone;
}

function findByBaseAndTone(items: AdminMessageTemplate[], baseKey: string, tone: string) {
  return items.find((t) => t.baseKey === baseKey && t.tone === tone) ?? null;
}

export function AdminTemplatesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tone, setTone] = useState<string>("acolhedor");
  const [category, setCategory] = useState<TemplateCategoryId>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newBaseKey, setNewBaseKey] = useState("custom.");
  const [newDescription, setNewDescription] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: () => api.adminListTemplates(token!),
    enabled: !!token,
  });

  const { data: onboardingFlow } = useQuery({
    queryKey: ["admin-onboarding-flow"],
    queryFn: () => api.adminGetOnboardingFlow(token!),
    enabled: !!token,
  });

  const byTone = useMemo(() => data?.filter((t) => t.tone === tone) ?? [], [data, tone]);

  const selected = useMemo(
    () => data?.find((t) => t.templateKey === selectedKey) ?? null,
    [data, selectedKey],
  );

  const filtered = byTone.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      t.baseKey.toLowerCase().includes(q) ||
      t.templateKey.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false)
    );
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpsertTemplate(token!, selectedKey!, content, description || undefined, selected?.locale),
    onSuccess: () => {
      toast.success("Mensagem padrão salva");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const baseKey = newBaseKey.trim().toLowerCase();
      const fullKey = buildTemplateKey(baseKey, tone);
      return api.adminUpsertTemplate(token!, fullKey, newContent, newDescription || undefined);
    },
    onSuccess: () => {
      toast.success("Nova mensagem criada");
      setCreateOpen(false);
      setNewBaseKey("custom.");
      setNewDescription("");
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao criar"),
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

  function selectByBaseKey(baseKey: string) {
    const t = findByBaseAndTone(data ?? [], baseKey, tone);
    if (t) selectTemplate(t);
    else toast.message(`Selecione o tom "${toneLabel(tone)}" no catálogo para ${baseKey}`);
  }

  function handleToneChange(next: string) {
    setTone(next);
    if (selected) {
      const nextTemplate = findByBaseAndTone(data ?? [], selected.baseKey, next);
      if (nextTemplate) selectTemplate(nextTemplate);
      else {
        setSelectedKey(null);
        setContent("");
        setDescription("");
      }
    }
  }

  const newBaseKeyValid = TEMPLATE_KEY_PATTERN.test(newBaseKey.trim().toLowerCase());
  const newKeyExists = data?.some(
    (t) => t.baseKey === newBaseKey.trim().toLowerCase() && t.tone === tone,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensagens padrão"
        description="Edite os textos globais usados por todos os tenants (por tom de voz)."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Nova mensagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova mensagem padrão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-key">Chave base</Label>
                  <Input
                    id="new-key"
                    value={newBaseKey}
                    onChange={(e) => setNewBaseKey(e.target.value)}
                    placeholder="custom.beneficios_farmacia"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tom atual: {toneLabel(tone)} →{" "}
                    <span className="font-mono">
                      {newBaseKeyValid
                        ? buildTemplateKey(newBaseKey.trim().toLowerCase(), tone)
                        : "chave.invalida"}
                    </span>
                  </p>
                  {!newBaseKeyValid && newBaseKey.length > 1 && (
                    <p className="text-xs text-destructive">
                      Use letras minúsculas, números, _ e pontos (ex: custom.promocao_verao).
                    </p>
                  )}
                  {newKeyExists && (
                    <p className="text-xs text-destructive">
                      Já existe mensagem para esta chave e tom — edite no catálogo.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-desc">Descrição (opcional)</Label>
                  <Input
                    id="new-desc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-content">Conteúdo</Label>
                  <Textarea
                    id="new-content"
                    rows={8}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending ||
                    !newBaseKeyValid ||
                    !newContent.trim() ||
                    newKeyExists
                  }
                >
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
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

      <Tabs value={category} onValueChange={(v) => setCategory(v as TemplateCategoryId)}>
        <TabsList className="h-auto flex-wrap justify-start">
          {TEMPLATE_CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs sm:text-sm">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {(category === "all" || category === "onboarding") && onboardingFlow && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fluxo de onboarding</CardTitle>
            <CardDescription>
              Ordem dos passos no WhatsApp. Clique para editar a mensagem do tom selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2">
              {onboardingFlow.steps.map((step, index) => (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => selectByBaseKey(step.templateKey)}
                    className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{step.description}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {step.templateKey}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ol>
            {onboardingFlow.systemMessages.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mensagens auxiliares do onboarding
                </p>
                <div className="flex flex-wrap gap-2">
                  {onboardingFlow.systemMessages.map((msg) => (
                    <Button
                      key={msg.templateKey}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => selectByBaseKey(msg.templateKey)}
                    >
                      {msg.description}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="text-base">
                Catálogo · {toneLabel(tone)}
                {category !== "all" && ` · ${categoryLabel(category)}`}
              </CardTitle>
              <GridSearchBar
                value={filter}
                onChange={setFilter}
                placeholder="Buscar por chave ou descrição"
                resultCount={filtered.length}
                totalCount={byTone.length}
              />
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="px-2 py-4 text-sm text-muted-foreground">
                  Nenhuma mensagem nesta categoria. Crie uma com &quot;Nova mensagem&quot;.
                </p>
              )}
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
                    <div className="flex shrink-0 gap-1">
                      {t.onboardingStepId && (
                        <Badge variant="outline" className="text-[10px]">
                          Fluxo
                        </Badge>
                      )}
                      {!t.isCatalog && (
                        <Badge variant="outline" className="text-[10px]">
                          Nova
                        </Badge>
                      )}
                      {t.isCustomized && <Badge variant="secondary">Editado</Badge>}
                    </div>
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
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{categoryLabel(selected.category)}</Badge>
                    {selected.onboardingStepId && (
                      <Badge variant="outline">Passo: {selected.onboardingStepId}</Badge>
                    )}
                  </div>
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
                  Selecione uma mensagem à esquerda ou crie uma nova. Use chaves{" "}
                  <span className="font-mono">custom.*</span> para mensagens extras na jornada.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
