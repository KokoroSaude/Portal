import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPasswordTab } from "@/components/settings/SettingsPasswordTab";
import { SettingsUsersTab } from "@/components/settings/SettingsUsersTab";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { LOCALE_LABELS, VOICE_TONES } from "@/lib/constants";
import type { TenantSettings } from "@/types/api";

export function SettingsPage() {
  const { token, isAdmin, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TenantSettings | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(token!),
    enabled: !!token,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.getSubscription(token!),
    enabled: !!token,
  });

  const { data: locales } = useQuery({
    queryKey: ["locales"],
    queryFn: () => api.getLocales(),
  });

  useEffect(() => {
    if (settings) setForm(settings);
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
          <p className="text-muted-foreground">Preferências da sua conta</p>
        </div>
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

  function update<K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Preferências operacionais e plano do tenant</p>
      </div>

      <Tabs defaultValue="operacional">
        <TabsList>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="plano">Plano</TabsTrigger>
          {hasFeature("users.manage") && <TabsTrigger value="usuarios">Usuários</TabsTrigger>}
          <TabsTrigger value="senha">Senha</TabsTrigger>
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
                  <Select value={form.voiceTone} onValueChange={(v) => update("voiceTone", v)}>
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
                  <Label>Idioma do tenant</Label>
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
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plano">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>Plano atual e features habilitadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl">{subscription.planName}</span>
                    <Badge variant="secondary">{subscription.planKey}</Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {subscription.features.map((f) => (
                      <div
                        key={f.key}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span>{f.name}</span>
                        <Badge variant={f.enabled ? "success" : "muted"}>
                          {f.enabled ? "Ativo" : "Bloqueado"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando plano…</p>
              )}
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

        <TabsContent value="senha">
          <Card>
            <CardHeader>
              <CardTitle>Alterar senha</CardTitle>
              <CardDescription>Atualize a senha da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsPasswordTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
