import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GitBranch, Plus } from "lucide-react";
import { AdminTemplateEditorPanel } from "@/components/admin/AdminTemplateEditorPanel";
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
import { ADMIN_TEMPLATE_TONES, adminTemplateToneLabel } from "@/lib/adminTemplateTones";
import { api, ApiClientError } from "@/lib/api";
import {
  buildTemplateKey,
  categoryLabel,
  TEMPLATE_CATEGORIES,
  TEMPLATE_KEY_PATTERN,
  type TemplateCategoryId,
} from "@/lib/templateCatalog";
import type { AdminMessageTemplate } from "@/types/api";

const OPERATIONAL_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c.id !== "onboarding" && c.id !== "all");

function findByBaseAndTone(items: AdminMessageTemplate[], baseKey: string, tone: string) {
  return items.find((t) => t.baseKey === baseKey && t.tone === tone) ?? null;
}

export function AdminTemplatesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tone, setTone] = useState("acolhedor");
  const [category, setCategory] = useState<TemplateCategoryId>("checkin");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [voiceContent, setVoiceContent] = useState("");
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

  const operationalByTone = useMemo(
    () => data?.filter((t) => t.tone === tone && t.category !== "onboarding") ?? [],
    [data, tone],
  );

  const selected = useMemo(
    () => data?.find((t) => t.templateKey === selectedKey) ?? null,
    [data, selectedKey],
  );

  const filtered = operationalByTone.filter((t) => {
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
      api.adminUpsertTemplate(
        token!,
        selectedKey!,
        content,
        description || undefined,
        selected?.locale,
        voiceContent.trim() || null,
      ),
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
    setVoiceContent(t.voiceContent ?? "");
    setDescription(t.description ?? "");
  }

  function handleToneChange(next: string) {
    setTone(next);
    if (selected) {
      const nextTemplate = findByBaseAndTone(data ?? [], selected.baseKey, next);
      if (nextTemplate) selectTemplate(nextTemplate);
      else {
        setSelectedKey(null);
        setContent("");
        setVoiceContent("");
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
        title="Mensagens operacionais"
        description="Lembretes, follow-up, reengajamento e textos do dia a dia — fora do cadastro inicial do paciente."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/onboarding">
                <GitBranch className="size-4" />
                Onboarding WhatsApp
              </Link>
            </Button>
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
                      Tom atual: {adminTemplateToneLabel(tone)} →{" "}
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
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cadastro de pacientes</CardTitle>
          <CardDescription>
            Boas-vindas, coleta de nome, medicamento e horários ficam em uma área separada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" asChild>
            <Link to="/admin/onboarding">
              <GitBranch className="size-4" />
              Editar fluxo de onboarding
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tone} onValueChange={handleToneChange}>
        <TabsList>
          {ADMIN_TEMPLATE_TONES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Tabs value={category} onValueChange={(v) => setCategory(v as TemplateCategoryId)}>
        <TabsList className="h-auto flex-wrap justify-start">
          {OPERATIONAL_CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="text-xs sm:text-sm">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader className="space-y-4">
              <CardTitle className="text-base">
                Catálogo · {adminTemplateToneLabel(tone)}
                {category !== "all" && ` · ${categoryLabel(category)}`}
              </CardTitle>
              <GridSearchBar
                value={filter}
                onChange={setFilter}
                placeholder="Buscar por nome ou chave"
                resultCount={filtered.length}
                totalCount={operationalByTone.length}
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
                    <span className="truncate">{t.description ?? t.baseKey}</span>
                    <div className="flex shrink-0 gap-1">
                      {!t.isCatalog && (
                        <Badge variant="outline" className="text-[10px]">
                          Nova
                        </Badge>
                      )}
                      {t.isCustomized && <Badge variant="secondary">Editado</Badge>}
                    </div>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{t.baseKey}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <AdminTemplateEditorPanel
            tone={tone}
            selected={selected}
            content={content}
            voiceContent={voiceContent}
            description={description}
            onContentChange={setContent}
            onVoiceContentChange={setVoiceContent}
            onDescriptionChange={setDescription}
            onSave={() => saveMutation.mutate()}
            onReset={() => selected && resetMutation.mutate(selected)}
            savePending={saveMutation.isPending}
            resetPending={resetMutation.isPending}
            emptyDescription='Selecione uma mensagem à esquerda ou crie uma nova com chave custom.* para textos extras na jornada do tenant.'
          />
        </div>
      )}
    </div>
  );
}
