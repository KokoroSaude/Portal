import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
  save: () => void;
  savePending: boolean;
  bulkOnboardingOpen: boolean;
  setBulkOnboardingOpen: (open: boolean) => void;
  bulkOnboardingPending: boolean;
  onBulkOnboarding: () => void;
};

export function SettingsOnboardingTab({
  form,
  update,
  save,
  savePending,
  bulkOnboardingOpen,
  setBulkOnboardingOpen,
  bulkOnboardingPending,
  onBulkOnboarding,
}: Props) {
  return (
    <Tabs defaultValue="cadastro" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="cadastro">Cadastro pendente</TabsTrigger>
        <TabsTrigger value="escalas">Escalas no fim</TabsTrigger>
      </TabsList>

      <TabsContent value="cadastro" className="mt-0 space-y-4">
        <SettingsSwitchField
          id="onboardingResumeEnabled"
          label="Lembrete automático"
          hint="Reenvia no WhatsApp a próxima pergunta do cadastro quando o paciente fica dias sem responder."
          checked={form.onboardingResumeEnabled}
          onCheckedChange={(checked) => update("onboardingResumeEnabled", checked)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsField
            htmlFor="onboardingResumeAfterDays"
            label="Esperar antes de lembrar (dias)"
            hint="Só dispara lembrete se o paciente ficar esse número de dias sem responder no fluxo de cadastro."
          >
            <Input
              id="onboardingResumeAfterDays"
              type="number"
              min={0}
              value={form.onboardingResumeAfterDays}
              onChange={(e) => update("onboardingResumeAfterDays", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            htmlFor="onboardingResumeCooldownHours"
            label="Intervalo entre lembretes (horas)"
            hint="Tempo mínimo entre dois lembretes automáticos de cadastro para o mesmo paciente."
          >
            <Input
              id="onboardingResumeCooldownHours"
              type="number"
              min={0}
              value={form.onboardingResumeCooldownHours}
              onChange={(e) => update("onboardingResumeCooldownHours", Number(e.target.value))}
            />
          </SettingsField>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SettingsSaveButton
            onSave={save}
            pending={savePending}
            label="Salvar lembretes automáticos"
          />
          <Dialog open={bulkOnboardingOpen} onOpenChange={setBulkOnboardingOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={bulkOnboardingPending}>
                <RefreshCw className="size-4" />
                Lembrar todos com cadastro em andamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lembrar todos com cadastro em andamento?</DialogTitle>
                <DialogDescription>
                  Cada paciente que ainda não terminou o cadastro receberá no WhatsApp a pergunta em
                  que parou. Quem não puder receber agora será ignorado.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkOnboardingOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={onBulkOnboarding} disabled={bulkOnboardingPending}>
                  {bulkOnboardingPending ? "Enviando…" : "Enviar lembretes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-sm text-muted-foreground">
          O envio manual é imediato: use{" "}
          <span className="font-medium text-foreground">Continuar cadastro</span> na ficha do paciente
          ou na lista de pacientes.
        </p>
      </TabsContent>

      <TabsContent value="escalas" className="mt-0 space-y-4">
        <SettingsSwitchField
          id="onboardingSurveyRandomPickEnabled"
          label="Escolher uma escala por paciente"
          hint="Ativo: cada paciente recebe só MMAS-8 ou só TCP ao concluir o cadastro (escolha estável). Desligado: aplica as duas em sequência."
          checked={form.onboardingSurveyRandomPickEnabled ?? false}
          onCheckedChange={(checked) => update("onboardingSurveyRandomPickEnabled", checked)}
        />
        <SettingsSaveButton onSave={save} pending={savePending} label="Salvar escalas no cadastro" />
      </TabsContent>
    </Tabs>
  );
}
