import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, Shield } from "lucide-react";
import { toast } from "sonner";
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
import { api, ApiClientError } from "@/lib/api";
import { downloadJsonFile } from "@/lib/compliance";

type Props = {
  token: string;
  patientId: string;
  patientName: string | null;
};

export function PatientDsarExportButton({ token, patientId, patientName }: Props) {
  const [open, setOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: () => api.exportPatientData(token, patientId),
    onSuccess: (data) => {
      const stamp = new Date().toISOString().slice(0, 10);
      const slug = (patientName ?? "paciente")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      downloadJsonFile(data, `dsar-${slug || patientId.slice(0, 8)}-${stamp}.json`);
      setOpen(false);
      toast.success("Exportação DSAR concluída. O acesso foi registrado na trilha de auditoria.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao exportar dados do titular"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="size-4" />
          Exportar dados (DSAR)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Exportar dados do titular
          </DialogTitle>
          <DialogDescription>
            Gera um arquivo JSON com cadastro, consentimentos, mensagens (metadados) e check-ins de{" "}
            <strong>{patientName ?? "este paciente"}</strong>. Use apenas para atendimento a
            solicitações LGPD. O download é registrado na auditoria da organização.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? "Exportando…" : "Confirmar exportação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
