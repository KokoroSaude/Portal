import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Play, RefreshCw, Volume2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { AdminVoiceCatalogEntry } from "@/types/api";

type VoiceAlias = "feminine" | "masculine";

function cacheBadge(cached: boolean) {
  return cached ? (
    <Badge variant="success">Em cache</Badge>
  ) : (
    <Badge variant="outline">Sem cache</Badge>
  );
}

export function AdminVoiceCatalogPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminVoiceCatalogEntry | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editText, setEditText] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-voice-catalog"],
    queryFn: () => api.adminGetVoiceCatalog(token!),
    enabled: !!token,
  });

  const warmAllMutation = useMutation({
    mutationFn: (force: boolean) =>
      api.adminWarmVoiceCache(token!, { forceRegenerate: force }),
    onSuccess: (result) => {
      toast.success(
        `Cache: ${result.warmed} gerados · ${result.cacheHits} já existiam · ${result.failed} falhas`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-voice-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao gerar cache"),
  });

  const warmEntryMutation = useMutation({
    mutationFn: (payload: { entryId: string; force: boolean }) =>
      api.adminWarmVoiceCache(token!, {
        entryIds: [payload.entryId],
        forceRegenerate: payload.force,
      }),
    onSuccess: () => {
      toast.success("Áudios regerados");
      queryClient.invalidateQueries({ queryKey: ["admin-voice-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao regerar"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpdateVoiceCatalogEntry(token!, editing!.id, {
        sampleText: editText,
        label: editLabel.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Texto salvo");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-voice-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const total = data.entries.length * data.voices.length;
    const cached = data.entries.reduce(
      (sum, e) => sum + e.voices.filter((v) => v.cached).length,
      0,
    );
    return { total, cached };
  }, [data]);

  async function playPreview(entryId: string, voice: VoiceAlias, force = false) {
    if (!token) return;
    const key = `${entryId}:${voice}`;
    setPlayingKey(key);
    try {
      const blob = await api.adminPreviewVoiceAudio(token, { entryId, voice, force });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = url;
        await audioRef.current.play();
        audioRef.current.onended = () => URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao reproduzir áudio");
    } finally {
      setPlayingKey(null);
    }
  }

  function openEdit(entry: AdminVoiceCatalogEntry) {
    setEditing(entry);
    setEditLabel(entry.label);
    setEditText(entry.sampleText);
  }

  return (
    <div className="space-y-6">
      <audio ref={audioRef} className="hidden" />
      <PageHeader
        title="Catálogo de vozes"
        description="Ouça, edite o texto e regere o cache TTS para voz feminina e masculina."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => warmAllMutation.mutate(false)}
              disabled={warmAllMutation.isPending}
            >
              Preencher cache
            </Button>
            <Button
              onClick={() => warmAllMutation.mutate(true)}
              disabled={warmAllMutation.isPending}
            >
              {warmAllMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="mr-2 h-4 w-4" />
              )}
              Regerar tudo
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Velocidade da fala: {data?.synthesisSpeed ?? "—"} · TTL do cache:{" "}
            {data?.cacheTtlHours ?? "—"}h
            {stats ? ` · ${stats.cached}/${stats.total} áudios em cache` : ""}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas do catálogo</CardTitle>
          <CardDescription>
            O texto editado aqui é o que vai para o Kokoro Voice no pré-cache e nas mensagens em
            áudio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            data?.entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{entry.label}</p>
                    {entry.templateKey ? (
                      <p className="text-xs text-muted-foreground font-mono">{entry.templateKey}</p>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar texto
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.sampleText}</p>
                {entry.preparedText !== entry.sampleText ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">TTS:</span> {entry.preparedText}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-4">
                  {entry.voices.map((voice) => (
                    <div
                      key={voice.alias}
                      className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{voice.displayName}</span>
                      {cacheBadge(voice.cached)}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={playingKey === `${entry.id}:${voice.alias}`}
                        onClick={() => playPreview(entry.id, voice.alias as VoiceAlias)}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Ouvir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={warmEntryMutation.isPending}
                        onClick={() =>
                          warmEntryMutation.mutate({ entryId: entry.id, force: true })
                        }
                      >
                        Regerar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar texto da voz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice-label">Rótulo</Label>
              <Input
                id="voice-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-text">Texto falado</Label>
              <Textarea
                id="voice-text"
                rows={6}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>
            {editing ? (
              <p className="text-xs text-muted-foreground">
                Após salvar, use &quot;Regerar&quot; para atualizar o cache das duas vozes.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !editText.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
