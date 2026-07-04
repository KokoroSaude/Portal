import { toast } from "sonner";
import type { PatientStatusChangeResponse } from "@/types/api";

export function toastPatientStatusUpdated(
  successMessage: string,
  result: PatientStatusChangeResponse,
) {
  toast.success(successMessage);

  if (result.notificationSent) {
    if (result.usedMetaTemplate) {
      toast.info("Mensagem enviada via template Meta (janela de 24h fechada).");
    }
    return;
  }

  toast.warning(
    result.notificationFailureReason
      ? `Status atualizado, mas o WhatsApp não foi enviado: ${result.notificationFailureReason}`
      : "Status atualizado, mas não foi possível enviar a mensagem no WhatsApp.",
  );
}
