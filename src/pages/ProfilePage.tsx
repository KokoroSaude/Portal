import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { PageHeader } from "@/components/PageHeader";
import { SettingsPasswordTab } from "@/components/settings/SettingsPasswordTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_MB = 2;

export function ProfilePage() {
  const { token, displayName, avatarUrl, updateAvatarUrl } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(token!, file),
    onSuccess: (profile) => {
      updateAvatarUrl(profile.avatarUrl);
      setPreview(null);
      toast.success("Foto atualizada");
    },
    onError: (err) => {
      setPreview(null);
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar foto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteAvatar(token!),
    onSuccess: () => {
      updateAvatarUrl(null);
      setPreview(null);
      toast.success("Foto removida");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover foto");
    },
  });

  function handleFileChange(file: File | undefined) {
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`A imagem deve ter no máximo ${MAX_MB} MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    uploadMutation.mutate(file);
  }

  const shownAvatar = preview ?? avatarUrl;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Foto e preferências da sua conta"
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Foto de perfil</CardTitle>
          <CardDescription>
            JPEG, PNG ou WebP — até {MAX_MB} MB. Aparece no menu lateral.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <UserAvatar
            name={displayName}
            avatarUrl={shownAvatar}
            className="size-24 text-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadMutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-4" />
              {uploadMutation.isPending ? "Enviando…" : "Escolher imagem"}
            </Button>
            {(avatarUrl || preview) && (
              <Button
                type="button"
                variant="ghost"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Atualize a senha da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsPasswordTab />
        </CardContent>
      </Card>
    </div>
  );
}
