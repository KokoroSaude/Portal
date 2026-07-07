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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { resolveVoiceCatalogCategory, type VoiceCatalogCategory } from "@/lib/voice-catalog";
import type { AdminVoiceCatalogEntry } from "@/types/api";

type VoiceAlias = "feminine" | "masculine";

const CATEGORY_TABS: { value: VoiceCatalogCategory; label: string; description: string }[] = [
  {
    value: "geral",
    label: "Geral",
    description: "Onboarding, check-in, lembretes e mensagens do fluxo principal.",
  },
  {
    value: "morisky",
    label: "Morisky",
    description: "Intro, perguntas MMAS-8 e encerramento da escala de adesão.",
  },
  {
    value: "tcp",
    label: "TCP",
    description: "Intro, perguntas da Teoria do Comportamento Planejado e intervenções.",
  },
];

function cacheBadge(cached: boolean) {
  return cached ? (
    <Badge variant="success">Em cache</Badge>
  ) : (
    <Badge variant="outline">Sem cache</Badge>
  );
}

function categoryStats(entries: AdminVoiceCatalogEntry[], voiceCount: number) {
  const total = entries.length * voiceCount;
  const cached = entries.reduce((sum, e) => sum + e.voices.filter((v) => v.cached).length, 0);
  return { total, cached };
}

type VoiceEntryListProps = {
  entries: AdminVoiceCatalogEntry[];
  playingKey: string | null;
  warmEntryPending: boolean;
  onEdit: (entry: AdminVoiceCatalogEntry) => void;
  onPlay: (entryId: string, voice: VoiceAlias) => void;
  onWarmEntry: (entryId: string) => void;
};

function VoiceEntryList({
  entries,
  playingKey,
  warmEntryPending,
  onEdit,
  onPlay,
  onWarmEntry,
}: VoiceEntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhuma entrada nesta categoria.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium">{entry.label}</p>
              {entry.templateKey ? (
                <p className="text-xs text-muted-foreground font-mono">{entry.templateKey}</p>
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(entry)}>
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
                  onClick={() => onPlay(entry.id, voice.alias as VoiceAlias)}
                >
                  <Play className="mr-1 h-3 w-3" />
                  Ouvir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={warmEntryPending}
                  onClick={() => onWarmEntry(entry.id)}
                >
                  Regerar
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
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
  const [activeTab, setActiveTab] = useState<VoiceCatalogCategory>("geral");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-voice-catalog"],
    queryFn: () => api.adminGetVoiceCatalog(token!),
    enabled: !!token,
  });

  const entriesByCategory = useMemo(() => {
    const grouped: Record<VoiceCatalogCategory, AdminVoiceCatalogEntry[]> = {
      geral: [],
      morisky: [],
      tcp: [],
    };
    for (const entry of data?.entries ?? []) {
      const category = resolveVoiceCatalogCategory(entry.templateKey, entry.category);
      grouped[category].push({ ...entry, category });
    }
    return grouped;
  }, [data?.entries]);

  const warmMutation = useMutation({
    mutationFn: (payload: { entryIds?: string[]; force: boolean }) =>
      api.adminWarmVoiceCache(token!, {
        entryIds: payload.entryIds,
        forceRegenerate: payload.force,
      }),
    onSuccess: (result) => {
      toast.success(
        `Cache: ${result.warmed} gerados · ${result.cacheHits} já existiam · ${result.failed} falhas`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-voice-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao gerar cache"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.adminUpdateVoiceCatalogEntry(token!, editing!.id, {
        sampleText: editText.trim(),
        label: editLabel.trim() || undefined,
      }),
    onSuccess: (updated) => {
      toast.success("Texto salvo");
      setEditing(null);
      queryClient.setQueryData(["admin-voice-catalog"], (prev: typeof data) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries.map((e) => (e.id === updated.id ? updated : e)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["admin-voice-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  const globalStats = useMemo(() => {
    if (!data) return null;
    return categoryStats(data.entries, data.voices.length);
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

  function warmCategory(category: VoiceCatalogCategory, force: boolean) {
    const entryIds = entriesByCategory[category].map((e) => e.id);
    if (entryIds.length === 0) {
      toast.message("Nenhuma entrada nesta aba para aquecer.");
      return;
    }
    warmMutation.mutate({ entryIds, force });
  }

  const activeEntries = entriesByCategory[activeTab];
  const activeStats = data ? categoryStats(activeEntries, data.voices.length) : null;

  return (
    <div className="space-y-6">
      <audio ref={audioRef} className="hidden" />
      <PageHeader
        title="Catálogo de vozes"
        description="Ouça, edite o texto e regere o cache TTS por fluxo — geral, Morisky e TCP."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => warmMutation.mutate({ force: false })}
              disabled={warmMutation.isPending}
            >
              Preencher tudo
            </Button>
            <Button
              onClick={() => warmMutation.mutate({ force: true })}
              disabled={warmMutation.isPending}
            >
              {warmMutation.isPending ? (
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
            {globalStats ? ` · ${globalStats.cached}/${globalStats.total} áudios em cache` : ""}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VoiceCatalogCategory)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {CATEGORY_TABS.map((tab) => {
            const count = entriesByCategory[tab.value].length;
            const stats = data ? categoryStats(entriesByCategory[tab.value], data.voices.length) : null;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                {tab.label}
                <Badge variant="secondary" className="font-normal">
                  {count}
                </Badge>
                {stats ? (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {stats.cached}/{stats.total}
                  </span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORY_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{tab.label}</CardTitle>
                  <CardDescription>
                    {tab.description}
                    {tab.value === activeTab && activeStats
                      ? ` · ${activeStats.cached}/${activeStats.total} em cache`
                      : ""}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={warmMutation.isPending}
                    onClick={() => warmCategory(tab.value, false)}
                  >
                    Preencher {tab.label}
                  </Button>
                  <Button
                    size="sm"
                    disabled={warmMutation.isPending}
                    onClick={() => warmCategory(tab.value, true)}
                  >
                    Regerar {tab.label}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <VoiceEntryList
                    entries={entriesByCategory[tab.value]}
                    playingKey={playingKey}
                    warmEntryPending={warmMutation.isPending}
                    onEdit={openEdit}
                    onPlay={playPreview}
                    onWarmEntry={(entryId) => warmMutation.mutate({ entryIds: [entryId], force: true })}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar texto da voz</DialogTitle>
            {editing?.templateKey ? (
              <p className="text-sm text-muted-foreground font-mono">{editing.templateKey}</p>
            ) : null}
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este texto é o que o paciente <strong>ouve</strong> quando a mensagem vai em áudio no
              WhatsApp. O texto escrito na conversa pode ser diferente.
            </p>
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
                placeholder="Frases curtas, sem emojis nem formatação WhatsApp."
              />
            </div>
            {editing?.preparedText && editing.preparedText !== editText ? (
              <p className="text-xs text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
                <span className="font-medium">Prévia TTS atual:</span> {editing.preparedText}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              O novo texto vale nos próximos áudios enviados. Use &quot;Regerar&quot; na lista só se
              quiser atualizar o cache de pré-escuta.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !editText.trim()}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
