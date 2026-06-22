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
import { SettingsField } from "@/components/settings/SettingsField";

type Props = {
  bulkCsatOpen: boolean;
  setBulkCsatOpen: (open: boolean) => void;
  bulkCsatPending: boolean;
  onBulkCsat: () => void;
};

export function SettingsSurveysTab({
  bulkCsatOpen,
  setBulkCsatOpen,
  bulkCsatPending,
  onBulkCsat,
}: Props) {
  return (
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
  );
}
