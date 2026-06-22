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
import { TPB_CONSTRUCT_LABELS, FEATURE_KEYS } from "@/lib/constants";
import type { TenantSettings } from "@/types/api";

type TpbTriggers = Pick<
  TenantSettings,
  | "tpbEnabled"
  | "tpbOnOnboarding"
  | "tpbPeriodicDays"
  | "tpbTriggerAfterMisses"
  | "tpbCooldownDays"
>;

export function TpbSettingsPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [triggers, setTriggers] = useState<TpbTriggers | null>(null);

  const scaleQuery = useQuery({
    queryKey: ["tpb-scale"],
    queryFn: () => api.getTpbScale(token!),
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
        tpbEnabled: s.tpbEnabled,
        tpbOnOnboarding: s.tpbOnOnboarding,
        tpbPeriodicDays: s.tpbPeriodicDays,
        tpbTriggerAfterMisses: s.tpbTriggerAfterMisses,
        tpbCooldownDays: s.tpbCooldownDays,
      });
    }
  }, [settingsQuery.data]);

  const [bulkOpen, setBulkOpen] = useState(false);

  const bulkTriggerMutation = useMutation({
    mutationFn: () => api.triggerTpbBulk(token!, { allActive: true }),
    onSuccess: (result) => {
      setBulkOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente ativo encontrado.");
        return;
      }
      toast.success(
        `TCP enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar TCP"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateSettings(token!, {
        tpbEnabled: triggers!.tpbEnabled,
        tpbOnOnboarding: triggers!.tpbOnOnboarding,
        tpbPeriodicDays: triggers!.tpbPeriodicDays ?? 0,
        tpbTriggerAfterMisses: triggers!.tpbTriggerAfterMisses ?? 0,
        tpbCooldownDays: triggers!.tpbCooldownDays,
      }),
    onSuccess: () => {
      toast.success("Gatilhos TCP salvos");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar"),
  });

  function patchTriggers(patch: Partial<TpbTriggers>) {
    setTriggers((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  if (!hasFeature(FEATURE_KEYS.scalesTpb)) {
    return (
      <>
        <PageHeader
          title="TCP (Teoria do Comportamento Planejado)"
          description="Escala de intenção e construtos comportamentais."
        />
        <FeatureLocked
          title="TCP não disponível"
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
          <CardDescription>Apenas administradores podem ver a escala TCP.</CardDescription>
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
  const hasOverride = scaleQuery.data?.hasTenantOverride ?? false;
  const questions = [...(scale?.questions ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <PageHeader
        title="TCP (Teoria do Comportamento Planejado)"
        description="Escala de intenção e construtos comportamentais — gatilhos configuráveis."
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          A escala TCP mede atitude, norma subjetiva, controle percebido e intenção de adesão.
          Configure <strong>quando</strong> a avaliação é enviada aos pacientes.
          {hasOverride && (
            <span className="ml-2">
              <Badge variant="secondary">Escala personalizada</Badge>
            </span>
          )}
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
                Quando a avaliação TCP é aplicada via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScaleTriggersForm
                scaleName="TCP"
                fields={{
                  enabled: triggers.tpbEnabled,
                  onOnboarding: triggers.tpbOnOnboarding,
                  periodicDays: triggers.tpbPeriodicDays,
                  triggerAfterMisses: triggers.tpbTriggerAfterMisses,
                  cooldownDays: triggers.tpbCooldownDays,
                }}
                enabledKey="tpbEnabled"
                onOnboardingKey="tpbOnOnboarding"
                periodicKey="tpbPeriodicDays"
                missesKey="tpbTriggerAfterMisses"
                cooldownKey="tpbCooldownDays"
                onChange={(patch) => patchTriggers({
                  ...(patch.enabled !== undefined && { tpbEnabled: patch.enabled }),
                  ...(patch.onOnboarding !== undefined && { tpbOnOnboarding: patch.onOnboarding }),
                  ...(patch.periodicDays !== undefined && { tpbPeriodicDays: patch.periodicDays }),
                  ...(patch.triggerAfterMisses !== undefined && {
                    tpbTriggerAfterMisses: patch.triggerAfterMisses,
                  }),
                  ...(patch.cooldownDays !== undefined && { tpbCooldownDays: patch.cooldownDays }),
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
                Envie o TCP fora dos gatilhos automáticos — por exemplo, para reavaliar um paciente
                específico ou toda a base ativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsField
                label="Enviar para todos os ativos"
                hint="Dispara o TCP imediatamente para cada paciente ativo. Ignora quem já está respondendo ou com check-in pendente. Não respeita o intervalo mínimo."
              >
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!triggers.tpbEnabled || bulkTriggerMutation.isPending}
                    >
                      <ClipboardList className="size-4" />
                      Enviar para todos os pacientes ativos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar TCP para todos os ativos?</DialogTitle>
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
                Na ficha do paciente (aba TCP) ou na lista (seleção múltipla), use{" "}
                <strong className="text-foreground">Enviar TCP</strong>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {scale && (
          <TabsContent value="escala" className="space-y-4">
            <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensagens do fluxo</CardTitle>
              <CardDescription>Textos enviados no WhatsApp</CardDescription>
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
              <CardDescription>Escala Likert 1–5 por construto</CardDescription>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {TPB_CONSTRUCT_LABELS[q.construct] ?? q.construct}
                        </Badge>
                        {q.reverseScored && (
                          <Badge variant="secondary" className="text-xs">
                            Pontuação invertida
                          </Badge>
                        )}
                        {!q.enabled && (
                          <Badge variant="secondary" className="text-xs">
                            Desabilitada
                          </Badge>
                        )}
                      </div>
                      <p>{q.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
