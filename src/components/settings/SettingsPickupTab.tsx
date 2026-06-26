import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { ErpCredentialsCard } from "@/components/settings/ErpCredentialsCard";
import { ErpHomologationChecklist } from "@/components/settings/ErpHomologationChecklist";
import { ErpIntegrationLogCard } from "@/components/settings/ErpIntegrationLogCard";
import { ErpSimulatorCard } from "@/components/settings/ErpSimulatorCard";
import { PasswordInput } from "@/components/ui/password-input";
import { PICKUP_NOTIFICATION_ROUTING_LABELS } from "@/lib/constants";
import type { ErpConnectionTestResult, TenantSettings } from "@/types/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsPickupTabProps = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
};

export function SettingsPickupTab({ form, update }: SettingsPickupTabProps) {
  const [testResult, setTestResult] = useState<ErpConnectionTestResult | null>(null);
  const [simulatorApiKey, setSimulatorApiKey] = useState<string | null>(null);

  return (
    <Tabs defaultValue="fila" className="space-y-4">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="fila">Fila e senhas</TabsTrigger>
        <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        <TabsTrigger value="prioridade">Prioridade e SUS</TabsTrigger>
        <TabsTrigger value="checkin">Check-in e painel</TabsTrigger>
        <TabsTrigger value="integracoes">Integrações</TabsTrigger>
      </TabsList>

      <TabsContent value="fila" className="mt-0 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SettingsField
            label="Prefixo da senha"
            hint="Letra ou código exibido antes do número na senha de retirada (ex.: A-042). Ajuda a organizar filas por guichê ou tipo de atendimento."
          >
            <Input
              value={form.pickupQueuePrefix ?? "A"}
              onChange={(e) => update("pickupQueuePrefix", e.target.value)}
              placeholder="A"
            />
          </SettingsField>

          <SettingsField
            label="Expiração da ordem (dias)"
            hint="Prazo máximo para o paciente retirar após a ordem ser liberada. Passado esse prazo, a ordem expira e pode voltar para realocação ou fila."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupOrderExpiryDays ?? 7}
              onChange={(e) => update("pickupOrderExpiryDays", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Dose diária padrão"
            hint="Quantidade de tomadas por dia usada para estimar quando o estoque do paciente acaba, quando não há plano de cuidado com horários definidos."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupDefaultDailyDose ?? 1}
              onChange={(e) => update("pickupDefaultDailyDose", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Janela padrão (horas)"
            hint="Duração do intervalo de retirada sugerido ao paciente (ex.: 08:00–10:00). Usado ao alocar ordens e validar chegada no balcão."
          >
            <Input
              type="number"
              min={1}
              max={8}
              value={form.pickupDefaultWindowHours ?? 2}
              onChange={(e) => update("pickupDefaultWindowHours", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Máx. reagendamentos por ordem"
            hint="Quantas vezes o paciente pode remarcar a data de retirada de uma mesma ordem pelo WhatsApp, antes de precisar de intervenção da equipe."
          >
            <Input
              type="number"
              min={0}
              value={form.pickupMaxReschedulesPerOrder ?? 2}
              onChange={(e) => update("pickupMaxReschedulesPerOrder", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Limite fila crônica (alerta)"
            hint="Número de pacientes na fila de medicamentos crônicos que dispara alerta operacional no painel quando ultrapassado."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupCriticalWaitlistThreshold ?? 20}
              onChange={(e) => update("pickupCriticalWaitlistThreshold", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Dias para retirar após aviso"
            hint="Prazo esperado (em dias) para o paciente comparecer após receber a notificação de medicamento disponível. Zero usa apenas a janela padrão."
          >
            <Input
              type="number"
              min={0}
              value={form.pickupExpectedPickupDaysAfterNotify ?? 0}
              onChange={(e) =>
                update("pickupExpectedPickupDaysAfterNotify", Number(e.target.value))
              }
            />
          </SettingsField>
        </div>
      </TabsContent>

      <TabsContent value="notificacoes" className="mt-0 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SettingsField
            label="Dias de antecedência do aviso"
            hint="Quantos dias antes do fim estimado do estoque o paciente recebe aviso para retirar ou entrar na fila, evitando ruptura de tratamento."
          >
            <Input
              type="number"
              min={0}
              value={form.pickupNotificationLeadDays ?? 3}
              onChange={(e) => update("pickupNotificationLeadDays", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Máx. avisos por dia"
            hint="Limite de mensagens de retirada enviadas por dia para toda a organização, protegendo contra spam e custo de WhatsApp."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupMaxNotificationsPerDay ?? 10}
              onChange={(e) => update("pickupMaxNotificationsPerDay", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Máx. lembretes de não-retirada"
            hint="Quantos lembretes automáticos são enviados quando o paciente não comparece na data prevista, antes de encerrar a tentativa."
          >
            <Input
              type="number"
              min={0}
              value={form.pickupMaxNoShowReminders ?? 2}
              onChange={(e) => update("pickupMaxNoShowReminders", Number(e.target.value))}
            />
          </SettingsField>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsField
            label="Roteamento — retirada"
            hint="Define se avisos de medicamento disponível vão para o paciente, para o responsável cadastrado ou para ambos."
          >
            <Select
              value={form.pickupNotificationRouting ?? "Both"}
              onValueChange={(v) =>
                update("pickupNotificationRouting", v as TenantSettings["pickupNotificationRouting"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PICKUP_NOTIFICATION_ROUTING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>

          <SettingsField
            label="Roteamento — adesão"
            hint="Mesma lógica de destinatário, aplicada a lembretes de check-in e adesão ao tratamento (não confundir com aviso de retirada)."
          >
            <Select
              value={form.adherenceNotificationRouting ?? "Both"}
              onValueChange={(v) =>
                update(
                  "adherenceNotificationRouting",
                  v as TenantSettings["adherenceNotificationRouting"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PICKUP_NOTIFICATION_ROUTING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsSwitchField
            id="pickupAutoNotifyOnStockArrival"
            label="Notificar ao receber lote"
            hint="Envia aviso automático quando o ERP informa entrada de estoque e a ordem do paciente é liberada para retirada."
            checked={form.pickupAutoNotifyOnStockArrival ?? false}
            onCheckedChange={(checked) => update("pickupAutoNotifyOnStockArrival", checked)}
          />
          <SettingsSwitchField
            id="pickupNoShowReminderEnabled"
            label="Lembrete de não-retirada"
            hint="Ativa mensagens de follow-up quando o paciente não retira no prazo, antes de marcar a ordem como não comparecimento."
            checked={form.pickupNoShowReminderEnabled ?? true}
            onCheckedChange={(checked) => update("pickupNoShowReminderEnabled", checked)}
          />
        </div>
      </TabsContent>

      <TabsContent value="prioridade" className="mt-0 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SettingsField
            label="CNES"
            hint="Código Nacional de Estabelecimentos de Saúde da unidade. Usado em validações SUS e integrações com regras de dispensação governamental."
          >
            <Input
              value={form.pickupCnesCode ?? ""}
              onChange={(e) => update("pickupCnesCode", e.target.value)}
              placeholder="0000000"
            />
          </SettingsField>

          <SettingsField
            label="Reserva emergencial (%)"
            hint="Percentual do lote reservado para casos urgentes na fila, reduzindo risco de falta para pacientes em prioridade clínica alta."
          >
            <Input
              type="number"
              min={0}
              max={50}
              value={form.pickupEmergencyReservePercent ?? 20}
              onChange={(e) => update("pickupEmergencyReservePercent", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Peso run-out (prioridade)"
            hint="Peso na pontuação de prioridade quando o estoque do paciente está perto de acabar. Valores maiores sobem na fila mais rápido."
          >
            <Input
              type="number"
              min={0}
              value={form.pickupRunOutPriorityWeight ?? 10}
              onChange={(e) => update("pickupRunOutPriorityWeight", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Alerta dispensação duplicada (dias)"
            hint="Se o mesmo paciente receber outra dispensação do mesmo medicamento dentro desse intervalo, a equipe vê alerta de possível duplicidade."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupDuplicateDispenseAlertDays ?? 7}
              onChange={(e) => update("pickupDuplicateDispenseAlertDays", Number(e.target.value))}
            />
          </SettingsField>

          <SettingsField
            label="Limite diário delegate (alerta)"
            hint="Número de retiradas feitas por um mesmo responsável no dia que dispara alerta de volume atípico (possível uso indevido)."
          >
            <Input
              type="number"
              min={1}
              value={form.pickupDelegateHighVolumeDailyLimit ?? 5}
              onChange={(e) =>
                update("pickupDelegateHighVolumeDailyLimit", Number(e.target.value))
              }
            />
          </SettingsField>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsSwitchField
            id="pickupSusRulesEnabled"
            label="Regras SUS (CATMAT/CNES)"
            hint="Aplica validações de medicamentos e estabelecimento conforme regras do SUS, incluindo códigos CATMAT no cadastro."
            checked={form.pickupSusRulesEnabled ?? false}
            onCheckedChange={(checked) => update("pickupSusRulesEnabled", checked)}
          />
          <SettingsSwitchField
            id="pickupSmartPriorityEnabled"
            label="Prioridade inteligente"
            hint="Ordena a fila combinando prioridade clínica, risco de run-out, adesão e tempo de espera, em vez de ordem puramente cronológica."
            checked={form.pickupSmartPriorityEnabled ?? true}
            onCheckedChange={(checked) => update("pickupSmartPriorityEnabled", checked)}
          />
          <SettingsSwitchField
            id="pickupBoostPriorityOnLowAdherence"
            label="Priorizar baixa adesão"
            hint="Dá peso extra na fila para pacientes com check-ins perdidos recentes, incentivando retirada antes da descontinuidade."
            checked={form.pickupBoostPriorityOnLowAdherence ?? true}
            onCheckedChange={(checked) => update("pickupBoostPriorityOnLowAdherence", checked)}
          />
        </div>
      </TabsContent>

      <TabsContent value="checkin" className="mt-0 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <SettingsSwitchField
            id="pickupQrCheckInEnabled"
            label="Check-in por QR"
            hint="Permite que o paciente ou responsável confirme chegada escaneando QR code no WhatsApp ou totem, gerando senha na fila."
            checked={form.pickupQrCheckInEnabled ?? false}
            onCheckedChange={(checked) => update("pickupQrCheckInEnabled", checked)}
          />
          <SettingsSwitchField
            id="pickupArrivalOutsideWindowWarn"
            label="Alerta chegada fora da janela"
            hint="Avisa a equipe quando o paciente chega fora do horário reservado, sem bloquear o atendimento."
            checked={form.pickupArrivalOutsideWindowWarn ?? true}
            onCheckedChange={(checked) => update("pickupArrivalOutsideWindowWarn", checked)}
          />
          <SettingsSwitchField
            id="pickupCsatEnabled"
            label="CSAT pós-retirada"
            hint="Envia pesquisa de satisfação (1–5) no WhatsApp após a retirada concluída, para medir experiência no balcão."
            checked={form.pickupCsatEnabled ?? true}
            onCheckedChange={(checked) => update("pickupCsatEnabled", checked)}
          />
        </div>

        {form.pickupQrCheckInEnabled && (
          <div className="max-w-sm">
            <SettingsField
              label="Validade token QR (dias)"
              hint="Tempo de validade do link ou token de check-in enviado ao paciente. Após expirar, é necessário gerar novo QR."
            >
              <Input
                type="number"
                min={1}
                value={form.pickupCheckInTokenTtlDays ?? 7}
                onChange={(e) => update("pickupCheckInTokenTtlDays", Number(e.target.value))}
              />
            </SettingsField>
          </div>
        )}

        <SettingsField
          label="Token painel TV"
          hint="Chave secreta para exibir a fila de senhas em /farmacia/tv no monitor da recepção, sem login de usuário."
          className="max-w-xl"
        >
          <PasswordInput
            value={form.pickupTvDisplayToken ?? ""}
            onChange={(e) => update("pickupTvDisplayToken", e.target.value)}
            placeholder="Token para /farmacia/tv"
          />
        </SettingsField>
      </TabsContent>

      <TabsContent value="integracoes" className="mt-0 space-y-4">
        <ErpHomologationChecklist form={form} testResult={testResult} />

        <ErpCredentialsCard
          form={form}
          update={update}
          onTestResult={setTestResult}
          onApiKeyGenerated={setSimulatorApiKey}
        />

        <SettingsField
          label="Webhook pós-export compras"
          hint="URL chamada após exportar planilha de compras CATMAT, para integrar com sistema de procurement ou BI externo."
        >
          <Input
            value={form.pickupProcurementWebhookUrl ?? ""}
            onChange={(e) => update("pickupProcurementWebhookUrl", e.target.value)}
            placeholder="https://..."
          />
        </SettingsField>

        <ErpIntegrationLogCard />

        <ErpSimulatorCard apiKey={simulatorApiKey} />
      </TabsContent>
    </Tabs>
  );
}
