import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Save } from "lucide-react";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { ScaleTriggersForm } from "@/components/settings/ScaleTriggersForm";
import { SettingsField } from "@/components/settings/SettingsField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiClientError } from "@/lib/api";
import { MORISKY_LEVEL_LABELS, FEATURE_KEYS } from "@/lib/constants";
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
  const { token, isAdmin, hasFeature } = useAuth();
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

  const [bulkOpen, setBulkOpen] = useState(false);

  const bulkTriggerMutation = useMutation({
    mutationFn: () => api.triggerMoriskyBulk(token!, { allActive: true }),
    onSuccess: (result) => {
      setBulkOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente ativo encontrado.");
        return;
      }
      toast.success(
        `MMAS-8 enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar MMAS-8"),
  });

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

  if (!hasFeature(FEATURE_KEYS.scalesMorisky)) {
    return (
      <>
        <PageHeader title="Escala MMAS-8 (Morisky)" description="Instrumento validado de adesão medicamentosa." />
        <FeatureLocked
          title="MMAS-8 não disponível"
          description="Este recurso não está incluído no seu plano atual."
        />
      </>
    );
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
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          As 8 perguntas, pontuação e faixas seguem o padrão MMAS-8 e não podem ser alteradas.
          Configure apenas <strong>quando</strong> a escala é enviada aos pacientes.
        </CardContent>
      </Card>

      <Tabs defaultValue="gatilhos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gatilhos">Gatilhos</TabsTrigger>
          <TabsTrigger value="manual">Disparo manual</TabsTrigger>
          {scale && <TabsTrigger value="escala">Conteúdo da escala</TabsTrigger>}
        </TabsList>

        <TabsContent value="gatilhos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gatilhos de envio</CardTitle>
              <CardDescription>
                Quando a avaliação MMAS-8 é aplicada via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScaleTriggersForm
                scaleName="MMAS-8"
                fields={{
                  enabled: triggers.moriskyEnabled,
                  onOnboarding: triggers.moriskyOnOnboarding,
                  periodicDays: triggers.moriskyPeriodicDays,
                  triggerAfterMisses: triggers.moriskyTriggerAfterMisses,
                  cooldownDays: triggers.moriskyCooldownDays,
                }}
                enabledKey="moriskyEnabled"
                onOnboardingKey="moriskyOnOnboarding"
                periodicKey="moriskyPeriodicDays"
                missesKey="moriskyTriggerAfterMisses"
                cooldownKey="moriskyCooldownDays"
                periodicHint="Reaplica o MMAS-8 após N dias da última TCP concluída (quando ambas escalas estão habilitadas)."
                onChange={(patch) => patchTriggers({
                  ...(patch.enabled !== undefined && { moriskyEnabled: patch.enabled }),
                  ...(patch.onOnboarding !== undefined && { moriskyOnOnboarding: patch.onOnboarding }),
                  ...(patch.periodicDays !== undefined && { moriskyPeriodicDays: patch.periodicDays }),
                  ...(patch.triggerAfterMisses !== undefined && {
                    moriskyTriggerAfterMisses: patch.triggerAfterMisses,
                  }),
                  ...(patch.cooldownDays !== undefined && { moriskyCooldownDays: patch.cooldownDays }),
                })}
              />

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="size-4" />
                {saveMutation.isPending ? "Salvando…" : "Salvar gatilhos"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disparo manual</CardTitle>
              <CardDescription>
                Envie o MMAS-8 fora dos gatilhos automáticos — por exemplo, para reavaliar um paciente
                específico ou toda a base ativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsField
                label="Enviar para todos os ativos"
                hint="Dispara o MMAS-8 imediatamente para cada paciente ativo. Ignora quem já está respondendo ou com check-in pendente. Não respeita o intervalo mínimo."
              >
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!triggers.moriskyEnabled || bulkTriggerMutation.isPending}
                    >
                      <ClipboardList className="size-4" />
                      Enviar para todos os pacientes ativos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar MMAS-8 para todos os ativos?</DialogTitle>
                      <DialogDescription>
                        Cada paciente com status &quot;Ativo&quot; receberá a pesquisa no WhatsApp.
                        Quem já estiver respondendo ou com check-in pendente será ignorado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkTriggerMutation.mutate()}
                        disabled={bulkTriggerMutation.isPending}
                      >
                        {bulkTriggerMutation.isPending ? "Enviando…" : "Confirmar envio"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SettingsField>
              <p className="text-sm text-muted-foreground">
                Na ficha do paciente (aba MMAS-8) ou na lista (seleção múltipla), use{" "}
                <strong className="text-foreground">Enviar MMAS-8</strong>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {scale && (
          <TabsContent value="escala" className="space-y-4">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
