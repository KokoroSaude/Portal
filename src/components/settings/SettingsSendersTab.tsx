import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeatureLocked } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import type { WhatsappSender } from "@/types/api";
import { formatDateTime, maskPhone } from "@/lib/utils";
import { WhatsappBusinessProfileEditor } from "@/components/whatsapp/WhatsappBusinessProfileEditor";

function senderConnectionLabel(sender: WhatsappSender): string {
  if (sender.connectionSource === "EmbeddedSignup") return "Meta";
  if (sender.connectionSource === "PlatformOnboarding") return "Kokoro OTP";
  return "Manual";
}

function SenderConnectionBadge({ sender }: { sender: WhatsappSender }) {
  const viaMeta = sender.connectionSource === "EmbeddedSignup";
  const viaPlatform = sender.connectionSource === "PlatformOnboarding";
  return (
    <Badge variant={viaMeta || viaPlatform ? "default" : "outline"}>
      {viaMeta ? "Conectado via Meta" : viaPlatform ? "Conectado via Kokoro" : "Manual"}
    </Badge>
  );
}

type SettingsSendersTabProps = {
  onAddViaOtp?: () => void;
};

export function SettingsSendersTab({ onAddViaOtp }: SettingsSendersTabProps) {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const { input, setInput, query } = useGridSearch();
  const [open, setOpen] = useState(false);
  const [profileSender, setProfileSender] = useState<WhatsappSender | null>(null);
  const [editing, setEditing] = useState<WhatsappSender | null>(null);
  const [form, setForm] = useState({
    phoneNumber: "",
    displayName: "",
    wabaId: "",
    phoneId: "",
  });

  function openEdit(sender: WhatsappSender) {
    setEditing(sender);
    setForm({
      phoneNumber: sender.phoneNumber,
      displayName: sender.displayName,
      wabaId: sender.wabaId,
      phoneId: sender.phoneId,
    });
  }

  function resetForm() {
    setForm({ phoneNumber: "", displayName: "", wabaId: "", phoneId: "" });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.whatsappSendersManage),
  });

  const createMutation = useMutation({
    mutationFn: () => api.createSender(token!, form),
    onSuccess: () => {
      toast.success("Número cadastrado");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      api.updateSender(token!, editing!.id, {
        phoneNumber: form.phoneNumber,
        displayName: form.displayName,
        wabaId: form.wabaId,
        phoneId: form.phoneId,
      }),
    onSuccess: () => {
      toast.success("Remetente atualizado");
      setEditing(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateSender(token!, id, { isActive }),
    onSuccess: () => {
      toast.success("Número atualizado");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const deleteMutation = useMutation({
    mutationFn: (sender: WhatsappSender) => api.deleteSender(token!, sender.id),
    onSuccess: () => {
      toast.success("Remetente excluído");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir"),
  });

  function confirmDelete(sender: WhatsappSender) {
    if (
      !window.confirm(
        `Excluir permanentemente o remetente "${sender.displayName}" (${maskPhone(sender.phoneNumber)})? Pacientes vinculados permanecem, mas deixam de apontar para este número.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(sender);
  }

  const filteredSenders = useMemo(() => {
    const all = data ?? [];
    return all.filter((s) =>
      matchesGridSearch(
        query,
        s.displayName,
        s.phoneNumber,
        s.wabaId,
        s.phoneId,
        s.isActive ? "ativo" : "inativo",
        senderConnectionLabel(s),
      ),
    );
  }, [data, query]);

  if (!hasFeature(FEATURE_KEYS.whatsappSendersManage)) {
    return (
      <FeatureLocked
        title="Números WhatsApp"
        description="Gerenciamento de remetentes não está disponível para sua conta."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Números cadastrados</CardTitle>
          <CardDescription>
            Números conectados por OTP, Meta ou cadastro manual. Edite perfil, foto e sites.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {onAddViaOtp && (
            <Button onClick={onAddViaOtp}>
              <Plus className="size-4" />
              Adicionar número (OTP)
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="size-4" />
                Inserir IDs manualmente
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastro manual de remetente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Telefone (E.164)</Label>
                <Input
                  placeholder="+5511999999999"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome de exibição</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>WABA ID</Label>
                <Input
                  value={form.wabaId}
                  onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone ID</Label>
                <Input
                  value={form.phoneId}
                  onChange={(e) => setForm((f) => ({ ...f, phoneId: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <GridSearchBar
          value={input}
          onChange={setInput}
          placeholder="Buscar por nome, telefone ou IDs Meta"
          resultCount={filteredSenders.length}
          totalCount={data?.length}
        />
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WABA / Phone ID</TableHead>
                <TableHead>Conexão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSenders.length === 0 && (
                <GridEmptyRow
                  colSpan={7}
                  message={
                    query.trim()
                      ? "Nenhum remetente corresponde à busca."
                      : "Nenhum remetente cadastrado."
                  }
                />
              )}
              {filteredSenders.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.displayName}</TableCell>
                  <TableCell className="font-mono text-sm">{maskPhone(s.phoneNumber)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.wabaId} / {s.phoneId}
                  </TableCell>
                  <TableCell>
                    <SenderConnectionBadge sender={s} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "success" : "muted"}>
                      {s.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(s.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfileSender(s)}
                      >
                        <UserCircle2 className="size-4" />
                        Perfil Meta
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })}
                      >
                        {s.isActive ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => confirmDelete(s)}
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar remetente WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Telefone (E.164)</Label>
              <Input
                placeholder="+5511999999999"
                value={form.phoneNumber}
                onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>WABA ID</Label>
              <Input
                value={form.wabaId}
                onChange={(e) => setForm((f) => ({ ...f, wabaId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone ID</Label>
              <Input
                value={form.phoneId}
                onChange={(e) => setForm((f) => ({ ...f, phoneId: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WhatsappBusinessProfileEditor
        sender={profileSender}
        open={profileSender !== null}
        onOpenChange={(v) => !v && setProfileSender(null)}
      />
    </Card>
  );
}
