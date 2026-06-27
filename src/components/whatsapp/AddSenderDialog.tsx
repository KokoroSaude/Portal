import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetaEmbeddedSignupConnect } from "@/components/whatsapp/MetaEmbeddedSignupConnect";
import { WhatsAppActivationWizard } from "@/components/whatsapp/WhatsAppActivationWizard";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

type AddSenderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddSenderDialog({ open, onOpenChange }: AddSenderDialogProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("otp");
  const [form, setForm] = useState({
    phoneNumber: "",
    displayName: "",
    wabaId: "",
    phoneId: "",
  });

  const resetManual = () =>
    setForm({ phoneNumber: "", displayName: "", wabaId: "", phoneId: "" });

  const createMutation = useMutation({
    mutationFn: () => api.createSender(token!, form),
    onSuccess: () => {
      toast.success("Número cadastrado");
      resetManual();
      queryClient.invalidateQueries({ queryKey: ["senders"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-activation-status"] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar número WhatsApp</DialogTitle>
          <DialogDescription>
            Escolha como conectar o número da farmácia.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="otp" className="flex-1">
              Código SMS
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex-1">
              Conta Meta
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="otp" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe o número da farmácia e confirme o código de 6 dígitos recebido por SMS ou
              ligação — sem login na Meta. Ideal para começar rápido.
            </p>
            <WhatsAppActivationWizard startOnPhone />
          </TabsContent>

          <TabsContent value="meta" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte uma WABA já existente com login Facebook/Meta. Use quando a farmácia já
              administra a conta Business separadamente.
            </p>
            <MetaEmbeddedSignupConnect onConnected={() => onOpenChange(false)} />
          </TabsContent>

          <TabsContent value="manual" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cadastro avançado: informe os IDs já existentes na Meta. A finalidade do número pode
              ser ajustada depois em <strong>Editar</strong>.
            </p>
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
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.phoneNumber.trim()}
              >
                Cadastrar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
