import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsUsersTab } from "@/components/settings/SettingsUsersTab";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { LOCALE_LABELS, VOICE_TONES } from "@/lib/constants";
import { normalizeVoiceToneSelectValue } from "@/lib/adminTemplateTones";
import type { TenantSettings } from "@/types/api";

export function SettingsPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<TenantSettings | null>(null);
  const [bulkCsatOpen, setBulkCsatOpen] = useState(false);
  const [bulkOnboardingOpen, setBulkOnboardingOpen] = useState(false);
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam === "usuarios" || tabParam === "operacional" ? tabParam : "operacional";

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(token!),
    enabled: !!token,
  });

  const { data: locales } = useQuery({
    queryKey: ["locales"],
    queryFn: () => api.getLocales(),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        voiceTone: normalizeVoiceToneSelectValue(settings.voiceTone),
        aiEnabled: settings.aiEnabled ?? false,
        voiceMessagesEnabled: settings.voiceMessagesEnabled ?? false,
        onboardingResumeEnabled: settings.onboardingResumeEnabled ?? true,
        onboardingResumeAfterDays: settings.onboardingResumeAfterDays ?? 2,
        onboardingResumeCooldownHours: settings.onboardingResumeCooldownHours ?? 24,
      });
    }
  }, [settings]);

  const bulkOnboardingMutation = useMutation({
    mutationFn: () => api.triggerOnboardingResumeBulk(token!, { allOnboarding: true }),
    onSuccess: (result) => {
      setBulkOnboardingOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente com cadastro em andamento.");
        return;
      }
      toast.success(
        `Lembrete enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar lembrete de cadastro"),
  });

  const bulkCsatMutation = useMutation({
    mutationFn: () => api.triggerCsatBulk(token!, { allActive: true }),
    onSuccess: (result) => {
      setBulkCsatOpen(false);
      if (result.sent === 0 && result.requested === 0) {
        toast.warning("Nenhum paciente ativo encontrado.");
        return;
      }
      toast.success(
        `Pesquisa enviada para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar pesquisa"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<TenantSettings>) => api.updateSettings(token!, payload),
    onSuccess: () => {
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao salvar");
    },
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl">Configurações</h1>
          <p className="text-muted-foreground">Preferências da organização</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Configurações operacionais são gerenciadas pelo administrador da organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/perfil">Ir para meu perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function update<K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Preferências operacionais da organização</p>
      </div>

      <Tabs defaultValue={defaultTab} key={defaultTab}>
        <TabsList>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          {hasFeature("users.manage") && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
        </TabsList>

        <TabsContent value="operacional">
          <Card>
            <CardHeader>
              <CardTitle>Operação</CardTitle>
              <CardDescription>
                Janela de envio, follow-ups e tom de voz das mensagens automáticas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sendWindowStart">Início da janela de envio</Label>
                  <Input
                    id="sendWindowStart"
                    type="time"
                    value={form.sendWindowStart}
                    onChange={(e) => update("sendWindowStart", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendWindowEnd">Fim da janela de envio</Label>
                  <Input
                    id="sendWindowEnd"
                    type="time"
                    value={form.sendWindowEnd}
                    onChange={(e) => update("sendWindowEnd", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup">Follow-up após (horas)</Label>
                  <Input
                    id="followup"
                    type="number"
                    min={1}
                    value={form.followupAfterHours}
                    onChange={(e) => update("followupAfterHours", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reengagement">Tentativas de reengajamento</Label>
                  <Input
                    id="reengagement"
                    type="number"
                    min={0}
                    value={form.maxReengagementAttempts}
                    onChange={(e) => update("maxReengagementAttempts", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inactiveDays">Dias inativo antes de reengajar</Label>
                  <Input
                    id="inactiveDays"
                    type="number"
                    min={1}
                    value={form.inactiveDaysBeforeReengagement}
                    onChange={(e) =>
                      update("inactiveDaysBeforeReengagement", Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tom de voz</Label>
                  <Select
                    value={normalizeVoiceToneSelectValue(form.voiceTone)}
                    onValueChange={(v) => update("voiceTone", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={form.locale} onValueChange={(v) => update("locale", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(locales ?? []).map((code) => (
                        <SelectItem key={code} value={code}>
                          {LOCALE_LABELS[code] ?? code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="aiEnabled">Inteligência artificial</Label>
                  <p className="text-sm text-muted-foreground">
                    NLU no WhatsApp, insights nos relatórios e personalização de marcos. Desligado usa
                    apenas regras determinísticas.
                  </p>
                </div>
                <Switch
                  id="aiEnabled"
                  checked={form.aiEnabled}
                  onCheckedChange={(checked) => update("aiEnabled", checked)}
                />
              </div>

              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nudge comportamental</CardTitle>
              <CardDescription>
                Reforço positivo variado, normas sociais nos marcos e limite de mensagens de empatia.
                {" "}
                <a
                  href="https://kokorosaude.com.br/nudge"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Ver princípios
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="nudgesEnabled">Nudges ativos</Label>
                  <p className="text-sm text-muted-foreground">
                    Master switch para reforço, variáveis de progresso e telemetria.
                  </p>
                </div>
                <Switch
                  id="nudgesEnabled"
                  checked={form.nudgesEnabled ?? true}
                  onCheckedChange={(checked) => update("nudgesEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="positiveReinforcementPoolEnabled">Pool de reforço positivo</Label>
                  <p className="text-sm text-muted-foreground">
                    Rotaciona 6 variantes após check-in SIM (sem repetir a última).
                  </p>
                </div>
                <Switch
                  id="positiveReinforcementPoolEnabled"
                  checked={form.positiveReinforcementPoolEnabled ?? true}
                  onCheckedChange={(checked) => update("positiveReinforcementPoolEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="socialNormNudgesEnabled">Normas sociais (cohort)</Label>
                  <p className="text-sm text-muted-foreground">
                    Frases ascendentes nos marcos D14/D30 quando há amostra suficiente.
                  </p>
                </div>
                <Switch
                  id="socialNormNudgesEnabled"
                  checked={form.socialNormNudgesEnabled ?? false}
                  onCheckedChange={(checked) => update("socialNormNudgesEnabled", checked)}
                />
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="maxEmpathyBlocksPerWeek">Máx. blocos de empatia / semana</Label>
                <Input
                  id="maxEmpathyBlocksPerWeek"
                  type="number"
                  min={1}
                  max={7}
                  value={form.maxEmpathyBlocksPerWeek ?? 3}
                  onChange={(e) => update("maxEmpathyBlocksPerWeek", Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gamificação</CardTitle>
              <CardDescription>
                Progresso visível no WhatsApp, conquistas e resumo diário opcional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="progressMenuEnabled">Menu &quot;Meu progresso&quot;</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe sequência, adesão e próximo marco no menu ativo do WhatsApp.
                  </p>
                </div>
                <Switch
                  id="progressMenuEnabled"
                  checked={form.progressMenuEnabled ?? true}
                  onCheckedChange={(checked) => update("progressMenuEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="achievementsEnabled">Conquistas</Label>
                  <p className="text-sm text-muted-foreground">
                    Badges automáticos após check-ins (streak, comeback, marcos).
                  </p>
                </div>
                <Switch
                  id="achievementsEnabled"
                  checked={form.achievementsEnabled ?? true}
                  onCheckedChange={(checked) => update("achievementsEnabled", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="dailySummaryEnabled">Resumo diário (21h)</Label>
                  <p className="text-sm text-muted-foreground">
                    Envia resumo do dia para pacientes ativos com check-in no dia.
                  </p>
                </div>
                <Switch
                  id="dailySummaryEnabled"
                  checked={form.dailySummaryEnabled ?? false}
                  onCheckedChange={(checked) => update("dailySummaryEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cadastro pendente no WhatsApp</CardTitle>
              <CardDescription>
                Para quem começou o cadastro pelo WhatsApp e parou no meio — sem terminar nome,
                medicamento ou horários.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="onboardingResumeEnabled">Lembrete automático</Label>
                  <p className="text-sm text-muted-foreground">
                    A Kokoro reenvia no WhatsApp a próxima pergunta do cadastro quando o paciente fica
                    alguns dias sem responder.
                  </p>
                </div>
                <Switch
                  id="onboardingResumeEnabled"
                  checked={form.onboardingResumeEnabled}
                  onCheckedChange={(checked) => update("onboardingResumeEnabled", checked)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="onboardingResumeAfterDays">Esperar antes de lembrar (dias)</Label>
                  <Input
                    id="onboardingResumeAfterDays"
                    type="number"
                    min={0}
                    value={form.onboardingResumeAfterDays}
                    onChange={(e) => update("onboardingResumeAfterDays", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Só envia lembrete se o paciente ficar esse tempo sem responder no WhatsApp.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onboardingResumeCooldownHours">Intervalo entre lembretes (horas)</Label>
                  <Input
                    id="onboardingResumeCooldownHours"
                    type="number"
                    min={0}
                    value={form.onboardingResumeCooldownHours}
                    onChange={(e) =>
                      update("onboardingResumeCooldownHours", Number(e.target.value))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo mínimo entre um lembrete e outro para o mesmo paciente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando…" : "Salvar lembretes automáticos"}
                </Button>
                <Dialog open={bulkOnboardingOpen} onOpenChange={setBulkOnboardingOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={bulkOnboardingMutation.isPending}>
                    <RefreshCw className="size-4" />
                    Lembrar todos com cadastro em andamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lembrar todos com cadastro em andamento?</DialogTitle>
                    <DialogDescription>
                      Cada paciente que ainda não terminou o cadastro receberá no WhatsApp a pergunta
                      em que parou. Quem não puder receber agora será ignorado.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkOnboardingOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => bulkOnboardingMutation.mutate()}
                      disabled={bulkOnboardingMutation.isPending}
                    >
                      {bulkOnboardingMutation.isPending ? "Enviando…" : "Enviar lembretes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>

              <p className="text-sm text-muted-foreground">
                O envio manual é imediato: use{" "}
                <span className="font-medium text-foreground">Continuar cadastro</span> na ficha do
                paciente ou na lista de pacientes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pesquisa de satisfação (CSAT)</CardTitle>
              <CardDescription>
                Dispare manualmente a pergunta de 1 a 5 no WhatsApp — por paciente, seleção na lista
                ou todos os ativos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={bulkCsatOpen} onOpenChange={setBulkCsatOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={bulkCsatMutation.isPending}>
                    <Star className="size-4" />
                    Enviar para todos os pacientes ativos
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar CSAT para todos os ativos?</DialogTitle>
                    <DialogDescription>
                      Cada paciente com status Ativo receberá a pesquisa no WhatsApp. Quem já tiver
                      pesquisa pendente ou estiver em check-in/MMAS-8 será ignorado.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkCsatOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => bulkCsatMutation.mutate()}
                      disabled={bulkCsatMutation.isPending}
                    >
                      {bulkCsatMutation.isPending ? "Enviando…" : "Confirmar envio"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {hasFeature("users.manage") && (
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Convide e gerencie acessos da organização</CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsUsersTab />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
