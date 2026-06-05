import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatDateTime, maskPhone } from "@/lib/utils";

export function SettingsSendersTab() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: "",
    displayName: "",
    wabaId: "",
    phoneId: "",
  });

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
      setForm({ phoneNumber: "", displayName: "", wabaId: "", phoneId: "" });
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateSender(token!, id, { isActive }),
    onSuccess: () => {
      toast.success("Número atualizado");
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  if (!hasFeature(FEATURE_KEYS.whatsappSendersManage)) {
    return (
      <FeatureLocked
        title="Números WhatsApp"
        description="Faça upgrade do plano para gerenciar remetentes WhatsApp Business."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Números cadastrados</CardTitle>
          <CardDescription>
            Cada remetente precisa do WABA ID e Phone ID da Meta para receber webhooks e enviar mensagens.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Novo número
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar remetente WhatsApp</DialogTitle>
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WABA / Phone ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum remetente cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.displayName}</TableCell>
                  <TableCell className="font-mono text-sm">{maskPhone(s.phoneNumber)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.wabaId} / {s.phoneId}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: s.id, isActive: !s.isActive })}
                    >
                      {s.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
