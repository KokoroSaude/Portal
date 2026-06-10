import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam === "usuarios" || tabParam === "operacional" || tabParam === "morisky"
      ? tabParam
      : "operacional";

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
        moriskyEnabled: settings.moriskyEnabled ?? false,
        moriskyOnOnboarding: settings.moriskyOnOnboarding ?? false,
        moriskyPeriodicDays: settings.moriskyPeriodicDays ?? null,
        moriskyTriggerAfterMisses: settings.moriskyTriggerAfterMisses ?? null,
        moriskyCooldownDays: settings.moriskyCooldownDays ?? 14,
      });
    }
  }, [settings]);

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
          <TabsTrigger value="morisky">Morisky</TabsTrigger>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label>Idioma da organização</Label>
                  <Select value={form.locale} onValueChange={(v) => update("locale", v)}>
                    <SelectTrigger className="max-w-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(locales ?? Object.keys(LOCALE_LABELS)).map((code) => (
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
                  <Label htmlFor="voiceMessagesEnabled">Mensagens em voz</Label>
                  <p className="text-sm text-muted-foreground">
                    Em breve — mensagens em áudio para pacientes. A preferência é salva, mas o envio
                    em voz ainda não está ativo.
                  </p>
                </div>
                <Switch
                  id="voiceMessagesEnabled"
                  checked={form.voiceMessagesEnabled ?? false}
                  onCheckedChange={(checked) => update("voiceMessagesEnabled", checked)}
                  disabled={!isAdmin}
                />
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
                  disabled={!isAdmin}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Escala de Morisky</CardTitle>
                  <CardDescription>
                    Avaliação de adesão medicamentosa via WhatsApp (MMAS-8 configurável).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <Label htmlFor="moriskyEnabled">Habilitar Morisky</Label>
                      <p className="text-sm text-muted-foreground">
                        Coleta autorrelato de adesão com perguntas Sim/Não.
                      </p>
                    </div>
                    <Switch
                      id="moriskyEnabled"
                      checked={form.moriskyEnabled ?? false}
                      onCheckedChange={(checked) => update("moriskyEnabled", checked)}
                      disabled={!isAdmin}
                    />
                  </div>

                  {form.moriskyEnabled && (
                    <>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="moriskyOnOnboarding">Aplicar no fim do onboarding</Label>
                        <Switch
                          id="moriskyOnOnboarding"
                          checked={form.moriskyOnOnboarding ?? false}
                          onCheckedChange={(checked) => update("moriskyOnOnboarding", checked)}
                          disabled={!isAdmin}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Reaplicar a cada (dias)</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Desligado"
                            value={form.moriskyPeriodicDays ?? ""}
                            onChange={(e) =>
                              update(
                                "moriskyPeriodicDays",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            disabled={!isAdmin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Disparar após misses consecutivos</Label>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Desligado"
                            value={form.moriskyTriggerAfterMisses ?? ""}
                            onChange={(e) =>
                              update(
                                "moriskyTriggerAfterMisses",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            disabled={!isAdmin}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cooldown entre avaliações (dias)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={form.moriskyCooldownDays ?? 14}
                            onChange={(e) => update("moriskyCooldownDays", Number(e.target.value))}
                            disabled={!isAdmin}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button variant="outline" asChild>
                    <Link to="/configuracoes/morisky">Editar perguntas e scoring</Link>
                  </Button>
                </CardContent>
              </Card>

              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="morisky">
          <Card>
            <CardHeader>
              <CardTitle>Escala Morisky (MMAS)</CardTitle>
              <CardDescription>
                Avaliação de adesão medicamentosa via WhatsApp — gatilhos automáticos e disparo manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="moriskyEnabled">Habilitar escala Morisky</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite aplicar a escala MMAS aos pacientes desta organização.
                  </p>
                </div>
                <Switch
                  id="moriskyEnabled"
                  checked={form.moriskyEnabled}
                  onCheckedChange={(checked) => update("moriskyEnabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="moriskyOnOnboarding">Aplicar no onboarding</Label>
                  <p className="text-sm text-muted-foreground">
                    Envia a escala automaticamente ao concluir o cadastro do paciente.
                  </p>
                </div>
                <Switch
                  id="moriskyOnOnboarding"
                  checked={form.moriskyOnOnboarding}
                  onCheckedChange={(checked) => update("moriskyOnOnboarding", checked)}
                  disabled={!form.moriskyEnabled}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="moriskyPeriodicDays">Reaplicar a cada (dias)</Label>
                  <Input
                    id="moriskyPeriodicDays"
                    type="number"
                    min={1}
                    placeholder="Desligado"
                    value={form.moriskyPeriodicDays ?? ""}
                    onChange={(e) =>
                      update(
                        "moriskyPeriodicDays",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    disabled={!form.moriskyEnabled}
                  />
                  <p className="text-xs text-muted-foreground">Deixe vazio para desativar reaplicação periódica.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moriskyTriggerAfterMisses">Disparar após misses consecutivos</Label>
                  <Input
                    id="moriskyTriggerAfterMisses"
                    type="number"
                    min={1}
                    placeholder="Desligado"
                    value={form.moriskyTriggerAfterMisses ?? ""}
                    onChange={(e) =>
                      update(
                        "moriskyTriggerAfterMisses",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    disabled={!form.moriskyEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dispara após N check-ins perdidos seguidos. Vazio = desligado.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moriskyCooldownDays">Intervalo mínimo entre avaliações (dias)</Label>
                  <Input
                    id="moriskyCooldownDays"
                    type="number"
                    min={1}
                    value={form.moriskyCooldownDays}
                    onChange={(e) => update("moriskyCooldownDays", Number(e.target.value))}
                    disabled={!form.moriskyEnabled}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando…" : "Salvar gatilhos"}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/configuracoes/morisky">Editar perguntas e pontuação</Link>
                </Button>
              </div>
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
