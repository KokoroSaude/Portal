import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Send, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { AdminMetaTemplateItem } from "@/types/api";

function statusVariant(status: string): "default" | "secondary" | "outline" | "success" | "warning" | "muted" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "APPROVED":
      return "Aprovado";
    case "PENDING":
      return "Em revisão";
    case "REJECTED":
      return "Rejeitado";
    case "NOT_SUBMITTED":
      return "Não enviado";
    default:
      return status;
  }
}

export function AdminMetaTemplatesPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState<string>("platform");
  const [preview, setPreview] = useState<AdminMetaTemplateItem | null>(null);
  const [editing, setEditing] = useState<AdminMetaTemplateItem | null>(null);
  const [editBody, setEditBody] = useState<AdminMetaTemplateItem | null>(null);
  const [metaName, setMetaName] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    keySuffix: "",
    metaName: "",
    body: "",
    category: "UTILITY",
    variables: [{ name: "nome", example: "Maria" }],
  });

  const resolvedTenantId = tenantId === "platform" ? undefined : tenantId;

  const { data: tenants } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => api.adminListTenants(token!),
    enabled: !!token,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-meta-templates", resolvedTenantId ?? "platform"],
    queryFn: () => api.adminListMetaTemplates(token!, resolvedTenantId),
    enabled: !!token,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { onlyMissing: boolean; onlyRejected: boolean; keys?: string[] }) =>
      api.adminSubmitMetaTemplates(token!, {
        tenantId: resolvedTenantId ?? null,
        canonicalKeys: payload.keys,
        onlyMissing: payload.onlyMissing,
        onlyRejected: payload.onlyRejected,
      }),
    onSuccess: (result) => {
      toast.success(`Enviados: ${result.submitted} · Pulados: ${result.skipped} · Falhas: ${result.failed}`);
      if (result.failed > 0) {
        const first = result.results.find((r) => !r.success);
        if (first?.message) toast.error(`${first.canonicalKey}: ${first.message}`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-meta-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao submeter"),
  });

  const mappingMutation = useMutation({
    mutationFn: () =>
      api.adminUpdateMetaTemplateMapping(
        token!,
        editing!.canonicalKey,
        metaName.trim(),
        resolvedTenantId ?? null,
      ),
    onSuccess: () => {
      toast.success("Mapeamento salvo");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-meta-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const bodyMutation = useMutation({
    mutationFn: () =>
      api.adminUpdateMetaTemplateBody(
        token!,
        editBody!.canonicalKey,
        customBody.trim() ? customBody.trim() : null,
        resolvedTenantId ?? null,
      ),
    onSuccess: () => {
      toast.success(editBody?.isCustom ? "Template atualizado" : "Corpo personalizado salvo");
      setEditBody(null);
      queryClient.invalidateQueries({ queryKey: ["admin-meta-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar corpo"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.adminCreateMetaTemplate(token!, {
        tenantId: resolvedTenantId ?? null,
        canonicalKey: `custom.${newTemplate.keySuffix.trim().toLowerCase().replace(/\s+/g, "_")}`,
        metaName: newTemplate.metaName.trim(),
        body: newTemplate.body.trim(),
        category: newTemplate.category,
        variables: newTemplate.variables.filter((v) => v.name.trim()),
      }),
    onSuccess: () => {
      toast.success("Template cadastrado — revise e submeta na Meta");
      setCreateOpen(false);
      setNewTemplate({
        keySuffix: "",
        metaName: "",
        body: "",
        category: "UTILITY",
        variables: [{ name: "nome", example: "Maria" }],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-meta-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (canonicalKey: string) =>
      api.adminDeleteMetaTemplate(token!, canonicalKey, resolvedTenantId ?? null),
    onSuccess: () => {
      toast.success("Template removido do cadastro local");
      void queryClient.invalidateQueries({ queryKey: ["admin-meta-templates"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir"),
  });

  const summary = useMemo(() => {
    const items = data?.templates ?? [];
    return {
      approved: items.filter((t) => t.syncStatus === "APPROVED").length,
      pending: items.filter((t) => t.syncStatus === "PENDING").length,
      rejected: items.filter((t) => t.syncStatus === "REJECTED").length,
      missing: items.filter((t) => t.syncStatus === "NOT_SUBMITTED").length,
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Templates Meta"
        description="Cadastro e status dos modelos WhatsApp fora da janela de 24h"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conta WhatsApp</CardTitle>
          <CardDescription>
            WABA usada para listar e submeter templates na Meta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label>Organização (opcional)</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Plataforma (padrão)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">Plataforma (remetente padrão)</SelectItem>
                {(tenants ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {data ? (
              <>
                <div>
                  <span className="font-medium text-foreground">WABA:</span> {data.wabaId}
                </div>
                <div>
                  Meta API: {data.metaConfigured ? "configurada" : "token ausente"}
                </div>
              </>
            ) : (
              <Skeleton className="h-10 w-48" />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo template
        </Button>
        <Button
          onClick={() => submitMutation.mutate({ onlyMissing: true, onlyRejected: false })}
          disabled={submitMutation.isPending || !data?.metaConfigured}
        >
          <Send className="mr-2 h-4 w-4" />
          Enviar pendentes
        </Button>
        <Button
          variant="secondary"
          onClick={() => submitMutation.mutate({ onlyMissing: false, onlyRejected: true })}
          disabled={submitMutation.isPending || !data?.metaConfigured || summary.rejected === 0}
        >
          Reenviar rejeitados
        </Button>
        <Badge variant="outline">Aprovados: {summary.approved}</Badge>
        <Badge variant="secondary">Em revisão: {summary.pending}</Badge>
        <Badge variant="secondary">Rejeitados: {summary.rejected}</Badge>
        <Badge variant="outline">Não enviados: {summary.missing}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catálogo Kokoro × Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <Skeleton className="h-40 w-full" />}
          {!isLoading &&
            (data?.templates ?? []).map((item) => (
              <div
                key={item.canonicalKey}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      #{item.number} {item.defaultMetaName}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.canonicalKey}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(item.syncStatus)}>{statusLabel(item.syncStatus)}</Badge>
                    <Badge variant="outline">{item.priority}</Badge>
                    {item.isCustom && <Badge variant="secondary">Personalizado</Badge>}
                    {item.category && <Badge variant="outline">{item.category}</Badge>}
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{item.effectiveBody}</p>
                {item.rejectionReason && (
                  <p className="text-sm text-destructive">Motivo: {item.rejectionReason}</p>
                )}
                {item.validationErrors.length > 0 && (
                  <ul className="text-sm text-destructive list-disc pl-5">
                    {item.validationErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setPreview(item)}>
                    Prévia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(item);
                      setMetaName(item.mappedMetaName ?? item.defaultMetaName);
                    }}
                  >
                    Nome na Meta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditBody(item);
                      setCustomBody(item.customBody ?? item.body);
                    }}
                  >
                    Editar corpo
                  </Button>
                  <Button
                    size="sm"
                    disabled={!item.canSubmit || submitMutation.isPending || !data?.metaConfigured}
                    onClick={() =>
                      submitMutation.mutate({
                        onlyMissing: false,
                        onlyRejected: false,
                        keys: [item.canonicalKey],
                      })
                    }
                  >
                    Submeter
                  </Button>
                  {item.isCustom && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            "Excluir este template do cadastro local? O modelo na Meta (se já submetido) não é removido automaticamente.",
                          )
                        ) {
                          return;
                        }
                        deleteMutation.mutate(item.canonicalKey);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prévia — {preview?.defaultMetaName}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap rounded-md bg-muted p-3">{preview.effectiveBody}</p>
              {preview.variables.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Exemplos</div>
                  <ul className="list-disc pl-5">
                    {preview.variables.map((v) => (
                      <li key={v.name}>
                        <code>{`{{${v.name}}}`}</code> → {v.example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {preview.buttons.length > 0 && (
                <div>Botões: {preview.buttons.join(" / ")}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nome na Meta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="meta-name">Nome aprovado ou a submeter</Label>
            <Input
              id="meta-name"
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => mappingMutation.mutate()} disabled={mappingMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBody} onOpenChange={(open) => !open && setEditBody(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar corpo Meta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {editBody?.isCustom
              ? "Template personalizado — edite o corpo respeitando as variáveis cadastradas."
              : "Use variáveis nomeadas (`{{nome}}`). O corpo não pode começar nem terminar com variável. Deixe vazio para restaurar o texto padrão do catálogo."}
          </p>
          <Textarea
            rows={8}
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
          />
          <DialogFooter>
            {!editBody?.isCustom && (
              <Button variant="outline" onClick={() => setCustomBody(editBody?.body ?? "")}>
                Restaurar padrão
              </Button>
            )}
            <Button onClick={() => bodyMutation.mutate()} disabled={bodyMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo template Meta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Templates personalizados usam chave <code>custom.*</code> e podem ser enviados à Meta como os do
            catálogo Kokoro. Variáveis no corpo: <code>{`{{nome}}`}</code> — não podem ficar no início nem no fim.
          </p>
          <div className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="custom-key">Chave Kokoro</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">custom.</span>
                  <Input
                    id="custom-key"
                    placeholder="campanha_verao"
                    value={newTemplate.keySuffix}
                    onChange={(e) => setNewTemplate((t) => ({ ...t, keySuffix: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-meta-name">Nome na Meta</Label>
                <Input
                  id="custom-meta-name"
                  placeholder="kokoro_campanha_verao"
                  value={newTemplate.metaName}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, metaName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(v) => setNewTemplate((t) => ({ ...t, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTILITY">UTILITY (transacional)</SelectItem>
                  <SelectItem value="MARKETING">MARKETING (promoções)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-body">Corpo</Label>
              <Textarea
                id="custom-body"
                rows={6}
                value={newTemplate.body}
                onChange={(e) => setNewTemplate((t) => ({ ...t, body: e.target.value }))}
                placeholder="Olá, {{nome}}! Temos uma novidade para você..."
              />
            </div>
            <div className="space-y-2">
              <Label>Variáveis</Label>
              {newTemplate.variables.map((variable, index) => (
                <div key={index} className="flex flex-wrap gap-2">
                  <Input
                    placeholder="nome"
                    value={variable.name}
                    onChange={(e) => {
                      const variables = [...newTemplate.variables];
                      variables[index] = { ...variables[index], name: e.target.value };
                      setNewTemplate((t) => ({ ...t, variables }));
                    }}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Exemplo"
                    value={variable.example}
                    onChange={(e) => {
                      const variables = [...newTemplate.variables];
                      variables[index] = { ...variables[index], example: e.target.value };
                      setNewTemplate((t) => ({ ...t, variables }));
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setNewTemplate((t) => ({
                    ...t,
                    variables: [...t.variables, { name: "", example: "" }],
                  }))
                }
              >
                Adicionar variável
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                createMutation.isPending ||
                !newTemplate.keySuffix.trim() ||
                !newTemplate.metaName.trim() ||
                !newTemplate.body.trim()
              }
            >
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
