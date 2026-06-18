import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import type { WhatsappSender } from "@/types/api";

const VERTICALS: { value: string; label: string }[] = [
  { value: "UNDEFINED", label: "Não informado" },
  { value: "HEALTH", label: "Saúde" },
  { value: "PROF_SERVICES", label: "Serviços profissionais" },
  { value: "RETAIL", label: "Varejo" },
  { value: "BEAUTY", label: "Beleza" },
  { value: "EDU", label: "Educação" },
  { value: "FINANCE", label: "Finanças" },
  { value: "GOVT", label: "Governo" },
  { value: "NONPROFIT", label: "Sem fins lucrativos" },
  { value: "OTHER", label: "Outro" },
];

function nameStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "APPROVED":
      return "Aprovado pela Meta";
    case "PENDING_REVIEW":
      return "Em análise pela Meta";
    case "DECLINED":
      return "Recusado pela Meta";
    case "EXPIRED":
      return "Expirado — renove na Meta";
    default:
      return status ?? "Desconhecido";
  }
}

type WhatsappBusinessProfileEditorProps = {
  sender: WhatsappSender | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WhatsappBusinessProfileEditor({
  sender,
  open,
  onOpenChange,
}: WhatsappBusinessProfileEditorProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    about: "",
    description: "",
    address: "",
    email: "",
    vertical: "UNDEFINED",
    website1: "",
    website2: "",
  });

  const { data: profile, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["whatsapp-business-profile", sender?.id],
    queryFn: () => api.getWhatsAppBusinessProfile(token!, sender!.id),
    enabled: !!token && !!sender && open,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      about: profile.about ?? "",
      description: profile.description ?? "",
      address: profile.address ?? "",
      email: profile.email ?? "",
      vertical: profile.vertical ?? "UNDEFINED",
      website1: profile.websites[0] ?? "",
      website2: profile.websites[1] ?? "",
    });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateWhatsAppBusinessProfile(token!, sender!.id, {
        about: form.about,
        description: form.description,
        address: form.address,
        email: form.email,
        vertical: form.vertical,
        websites: [form.website1, form.website2].filter((w) => w.trim().length > 0),
      }),
    onSuccess: () => {
      toast.success("Perfil WhatsApp atualizado na Meta");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-business-profile", sender?.id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar perfil"),
  });

  const pictureMutation = useMutation({
    mutationFn: (file: File) => api.uploadWhatsAppBusinessProfilePicture(token!, sender!.id, file),
    onSuccess: () => {
      toast.success("Foto de perfil enviada para a Meta");
      queryClient.invalidateQueries({ queryKey: ["whatsapp-business-profile", sender?.id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar foto"),
  });

  function handlePictureChange(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Use JPEG ou PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    pictureMutation.mutate(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Perfil WhatsApp na Meta</DialogTitle>
          <DialogDescription>
            {sender
              ? `${sender.displayName} · ${sender.phoneNumber}`
              : "Selecione um remetente"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !profile ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o perfil. Verifique se o token Meta tem acesso a este número.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start gap-4 rounded-xl border p-4">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt="Foto do perfil WhatsApp"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium">{profile.verifiedName ?? "Sem nome verificado"}</p>
                  <Badge variant="outline" className="mt-1">
                    {nameStatusLabel(profile.nameStatus)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  O <strong>nome comercial verificado</strong> é aprovado pela Meta no Business Manager — não
                  pode ser alterado aqui.{" "}
                  <a
                    href="https://business.facebook.com/wa/manage/phone-numbers/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-primary underline-offset-2 hover:underline"
                  >
                    Abrir WhatsApp Manager
                    <ExternalLink className="ml-1 size-3" />
                  </a>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => handlePictureChange(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pictureMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {pictureMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando foto…
                    </>
                  ) : (
                    "Alterar foto"
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-about">Sobre (máx. 139 caracteres)</Label>
              <Textarea
                id="wa-about"
                rows={2}
                maxLength={139}
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground text-right">{form.about.length}/139</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-description">Descrição</Label>
              <Textarea
                id="wa-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-address">Endereço</Label>
              <Input
                id="wa-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wa-email">E-mail</Label>
                <Input
                  id="wa-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={form.vertical}
                  onValueChange={(value) => setForm((f) => ({ ...f, vertical: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTICALS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-site1">Site 1</Label>
              <Input
                id="wa-site1"
                placeholder="https://"
                value={form.website1}
                onChange={(e) => setForm((f) => ({ ...f, website1: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-site2">Site 2 (opcional)</Label>
              <Input
                id="wa-site2"
                placeholder="https://"
                value={form.website2}
                onChange={(e) => setForm((f) => ({ ...f, website2: e.target.value }))}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? <Loader2 className="size-4 animate-spin" /> : "Recarregar"}
          </Button>
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!profile || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar na Meta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
