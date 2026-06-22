import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsEngagementTab({ form, update }: Props) {
  return (
    <Tabs defaultValue="nudge" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="nudge">Nudge comportamental</TabsTrigger>
        <TabsTrigger value="gamificacao">Gamificação</TabsTrigger>
      </TabsList>

      <TabsContent value="nudge" className="mt-0 space-y-3">
        <SettingsSwitchField
          id="nudgesEnabled"
          label="Nudges ativos"
          hint="Interruptor geral de reforço positivo, variáveis de progresso e telemetria comportamental no WhatsApp."
          checked={form.nudgesEnabled ?? true}
          onCheckedChange={(checked) => update("nudgesEnabled", checked)}
        />
        <SettingsSwitchField
          id="positiveReinforcementPoolEnabled"
          label="Pool de reforço positivo"
          hint="Após check-in SIM, rotaciona entre 6 mensagens de reforço sem repetir a última enviada."
          checked={form.positiveReinforcementPoolEnabled ?? true}
          onCheckedChange={(checked) => update("positiveReinforcementPoolEnabled", checked)}
        />
        <SettingsSwitchField
          id="socialNormNudgesEnabled"
          hint="Inclui frases de norma social nos marcos D14/D30 quando há cohort com amostra estatística suficiente."
          label="Normas sociais (cohort)"
          checked={form.socialNormNudgesEnabled ?? false}
          onCheckedChange={(checked) => update("socialNormNudgesEnabled", checked)}
        />
        <div className="max-w-xs">
          <SettingsField
            htmlFor="maxEmpathyBlocksPerWeek"
            label="Máx. blocos de empatia / semana"
            hint="Limita mensagens empáticas extras por paciente por semana, evitando saturação emocional."
          >
            <Input
              id="maxEmpathyBlocksPerWeek"
              type="number"
              min={1}
              max={7}
              value={form.maxEmpathyBlocksPerWeek ?? 3}
              onChange={(e) => update("maxEmpathyBlocksPerWeek", Number(e.target.value))}
            />
          </SettingsField>
        </div>
      </TabsContent>

      <TabsContent value="gamificacao" className="mt-0 space-y-3">
        <SettingsSwitchField
          id="progressMenuEnabled"
          label='Menu "Meu progresso"'
          hint="Exibe sequência de check-ins, adesão e próximo marco no menu interativo do WhatsApp."
          checked={form.progressMenuEnabled ?? true}
          onCheckedChange={(checked) => update("progressMenuEnabled", checked)}
        />
        <SettingsSwitchField
          id="achievementsEnabled"
          label="Conquistas"
          hint="Badges automáticos após check-ins (streak, comeback, marcos D7/D14/D30 etc.)."
          checked={form.achievementsEnabled ?? true}
          onCheckedChange={(checked) => update("achievementsEnabled", checked)}
        />
        <SettingsSwitchField
          id="dailySummaryEnabled"
          label="Resumo diário (21h)"
          hint="Envia às 21h um resumo do dia para pacientes ativos que fizeram check-in naquele dia."
          checked={form.dailySummaryEnabled ?? false}
          onCheckedChange={(checked) => update("dailySummaryEnabled", checked)}
        />
      </TabsContent>
    </Tabs>
  );
}
