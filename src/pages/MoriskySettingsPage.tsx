import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { MORISKY_LEVEL_LABELS } from "@/lib/constants";
import type { TenantSettings } from "@/types/api";

type MoriskyTriggers = Pick<
  TenantSettings,
  | "moriskyEnabled"
  | "moriskyOnOnboarding"
  | "moriskyPeriodicDays"
  | "moriskyTriggerAfterMisses"
  | "moriskyCooldownDays"
>;

export function MoriskySettingsPage() {
  const { token, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [triggers, setTriggers] = useState<MoriskyTriggers | null>(null);

  const scaleQuery = useQuery({
    queryKey: ["morisky-scale"],
    queryFn: () => api.getMoriskyScale(token!),
    enabled: !!token && isAdmin,
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(token!),
    enabled: !!token && isAdmin,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data;
      setTriggers({
        moriskyEnabled: s.moriskyEnabled,
        moriskyOnOnboarding: s.moriskyOnOnboarding,
        moriskyPeriodicDays: s.moriskyPeriodicDays,
        moriskyTriggerAfterMisses: s.moriskyTriggerAfterMisses,
        moriskyCooldownDays: s.moriskyCooldownDays,
      });
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateSettings(token!, {
        moriskyEnabled: triggers!.moriskyEnabled,
        moriskyOnOnboarding: triggers!.moriskyOnOnboarding,
        moriskyPeriodicDays: triggers!.moriskyPeriodicDays ?? 0,
        moriskyTriggerAfterMisses: triggers!.moriskyTriggerAfterMisses ?? 0,
        moriskyCooldownDays: triggers!.moriskyCooldownDays,
      }),
    onSuccess: () => {
      toast.success("Gatilhos MMAS-8 salvos");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  function patchTriggers(patch: Partial<MoriskyTriggers>) {
    setTriggers((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Apenas administradores podem ver a escala MMAS-8.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (scaleQuery.isLoading || settingsQuery.isLoading || !triggers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const scale = scaleQuery.data?.scale;
  const questions = [...(scale?.questions ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escala MMAS-8 (Morisky)"
        description="Instrumento validado de adesão medicamentosa — perguntas fixas, gatilhos configuráveis."
        actions={
          <Button variant="outline" asChild>
            <Link to="/configuracoes">
              <ArrowLeft className="size-4" />
              Configurações
            </Link>
          </Button>
        }
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          As 8 perguntas, pontuação e faixas seguem o padrão MMAS-8 e não podem ser alteradas.
          Configure apenas <strong>quando</strong> a escala é enviada aos pacientes.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gatilhos de envio</CardTitle>
          <CardDescription>Quando a avaliação MMAS-8 é aplicada via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="moriskyEnabled">Habilitar MMAS-8</Label>
              <p className="text-sm text-muted-foreground">
                Ativa a escala Morisky para pacientes desta organização.
              </p>
            </div>
            <Switch
              id="moriskyEnabled"
              checked={triggers.moriskyEnabled}
              onCheckedChange={(checked) => patchTriggers({ moriskyEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="moriskyOnOnboarding">Após onboarding</Label>
              <p className="text-sm text-muted-foreground">
                Envia ao concluir o cadastro do paciente.
              </p>
            </div>
            <Switch
              id="moriskyOnOnboarding"
              checked={triggers.moriskyOnOnboarding}
              onCheckedChange={(checked) => patchTriggers({ moriskyOnOnboarding: checked })}
              disabled={!triggers.moriskyEnabled}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="moriskyPeriodicDays">Reaplicar a cada (dias)</Label>
              <Input
                id="moriskyPeriodicDays"
                type="number"
                min={0}
                placeholder="Desligado"
                value={triggers.moriskyPeriodicDays ?? ""}
                disabled={!triggers.moriskyEnabled}
                onChange={(e) =>
                  patchTriggers({
                    moriskyPeriodicDays:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para desativar.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moriskyTriggerAfterMisses">Após misses consecutivos</Label>
              <Input
                id="moriskyTriggerAfterMisses"
                type="number"
                min={0}
                placeholder="Desligado"
                value={triggers.moriskyTriggerAfterMisses ?? ""}
                disabled={!triggers.moriskyEnabled}
                onChange={(e) =>
                  patchTriggers({
                    moriskyTriggerAfterMisses:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Check-ins perdidos seguidos.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moriskyCooldownDays">Intervalo mínimo (dias)</Label>
              <Input
                id="moriskyCooldownDays"
                type="number"
                min={1}
                value={triggers.moriskyCooldownDays}
                disabled={!triggers.moriskyEnabled}
                onChange={(e) =>
                  patchTriggers({ moriskyCooldownDays: Number(e.target.value) || 14 })
                }
              />
              <p className="text-xs text-muted-foreground">Entre duas avaliações do mesmo paciente.</p>
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="size-4" />
            {saveMutation.isPending ? "Salvando…" : "Salvar gatilhos"}
          </Button>
        </CardContent>
      </Card>

      {scale && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensagens do fluxo</CardTitle>
              <CardDescription>Textos enviados no WhatsApp (padrão MMAS-8)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Introdução</p>
                <p className="whitespace-pre-wrap">{scale.introText}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Resposta inválida</p>
                <p>{scale.invalidText}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Agradecimento</p>
                <p>{scale.thankYouText}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perguntas ({questions.length})</CardTitle>
              <CardDescription>Ordem e textos oficiais MMAS-8</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="flex gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {q.order}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p>{q.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.yesScoresPoint ? "Sim = 1 pt (aderente)" : "Não = 1 pt (aderente)"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classificação</CardTitle>
              <CardDescription>Faixas de score MMAS-8</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              {scale.levels.map((level) => (
                <div key={level.level} className="rounded-lg border p-4">
                  <Badge variant="secondary" className="mb-2">
                    {MORISKY_LEVEL_LABELS[level.level] ?? level.level}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Score {level.minScore}–{level.maxScore}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
