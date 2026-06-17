import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Save } from "lucide-react";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gatilhos de envio</CardTitle>
          <CardDescription>Quando a avaliação TCP é aplicada via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="tpbEnabled">Habilitar TCP</Label>
              <p className="text-sm text-muted-foreground">
                Ativa a escala TCP para pacientes desta organização.
              </p>
            </div>
            <Switch
              id="tpbEnabled"
              checked={triggers.tpbEnabled}
              onCheckedChange={(checked) => patchTriggers({ tpbEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="tpbOnOnboarding">Após onboarding</Label>
              <p className="text-sm text-muted-foreground">
                Envia ao concluir o cadastro do paciente.
              </p>
            </div>
            <Switch
              id="tpbOnOnboarding"
              checked={triggers.tpbOnOnboarding}
              onCheckedChange={(checked) => patchTriggers({ tpbOnOnboarding: checked })}
              disabled={!triggers.tpbEnabled}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tpbPeriodicDays">Reaplicar a cada (dias)</Label>
              <Input
                id="tpbPeriodicDays"
                type="number"
                min={0}
                placeholder="Desligado"
                value={triggers.tpbPeriodicDays ?? ""}
                disabled={!triggers.tpbEnabled}
                onChange={(e) =>
                  patchTriggers({
                    tpbPeriodicDays: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para desativar.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpbTriggerAfterMisses">Após misses consecutivos</Label>
              <Input
                id="tpbTriggerAfterMisses"
                type="number"
                min={0}
                placeholder="Desligado"
                value={triggers.tpbTriggerAfterMisses ?? ""}
                disabled={!triggers.tpbEnabled}
                onChange={(e) =>
                  patchTriggers({
                    tpbTriggerAfterMisses: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Check-ins perdidos seguidos.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpbCooldownDays">Intervalo mínimo (dias)</Label>
              <Input
                id="tpbCooldownDays"
                type="number"
                min={1}
                value={triggers.tpbCooldownDays}
                disabled={!triggers.tpbEnabled}
                onChange={(e) =>
                  patchTriggers({ tpbCooldownDays: Number(e.target.value) || 30 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Entre avaliações automáticas. Disparos manuais ignoram este intervalo.
              </p>
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="size-4" />
            {saveMutation.isPending ? "Salvando…" : "Salvar gatilhos"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disparo manual</CardTitle>
          <CardDescription>
            Envie o TCP fora dos gatilhos automáticos — por exemplo, para reavaliar um paciente
            específico ou toda a base ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Na ficha do paciente (aba TCP) ou na lista de pacientes (seleção múltipla), use{" "}
            <strong className="text-foreground">Enviar TCP</strong>. O intervalo mínimo não se
            aplica a disparos manuais.
          </p>
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
                  Cada paciente com status &quot;Ativo&quot; receberá a pesquisa no WhatsApp. Quem já
                  estiver respondendo ou com check-in pendente será ignorado.
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
        </CardContent>
      </Card>

      {scale && (
        <>
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
        </>
      )}
    </div>
  );
}
