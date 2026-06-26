import { Star } from "lucide-react";
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
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import type { TenantSettings } from "@/types/api";

type Props = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
  save: () => void;
  savePending: boolean;
  bulkCsatOpen: boolean;
  setBulkCsatOpen: (open: boolean) => void;
  bulkCsatPending: boolean;
  onBulkCsat: () => void;
};

export function SettingsSurveysTab({
  form,
  update,
  save,
  savePending,
  bulkCsatOpen,
  setBulkCsatOpen,
  bulkCsatPending,
  onBulkCsat,
}: Props) {
  return (
    <div className="space-y-6">
      <SettingsField
        htmlFor="csatPeriodicDays"
        label="Reaplicar a cada (dias)"
        hint="Reenvia automaticamente a pesquisa CSAT para pacientes ativos que não receberam nos últimos N dias. Deixe vazio para desativar o envio periódico."
      >
        <Input
          id="csatPeriodicDays"
          type="number"
          min={0}
          placeholder="Desligado"
          value={form.csatPeriodicDays ?? ""}
          onChange={(e) =>
            update(
              "csatPeriodicDays",
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
        />
      </SettingsField>

      <SettingsSaveButton onSave={save} pending={savePending} />

      <SettingsField
        label="Envio em massa de CSAT"
        hint="Dispara manualmente a pesquisa de satisfação (nota 1–5) no WhatsApp para todos os pacientes ativos. Ignora quem já tem pesquisa pendente ou está em outro fluxo."
      >
        <Dialog open={bulkCsatOpen} onOpenChange={setBulkCsatOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" disabled={bulkCsatPending}>
              <Star className="size-4" />
              Enviar para todos os pacientes ativos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar CSAT para todos os ativos?</DialogTitle>
              <DialogDescription>
                Cada paciente com status Ativo receberá a pesquisa no WhatsApp. Quem já tiver pesquisa
                pendente ou estiver em check-in/MMAS-8 será ignorado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkCsatOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={onBulkCsat} disabled={bulkCsatPending}>
                {bulkCsatPending ? "Enviando…" : "Confirmar envio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SettingsField>
    </div>
  );
}
