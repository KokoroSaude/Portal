import { Link } from "react-router-dom";
import { CalendarClock, ExternalLink, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CONVERSATION_STEP_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { PatientScheduling } from "@/types/api";
import { hasUnconfirmedSentReminder } from "@/components/patients/PatientWhatsAppWindowBanner";

type PatientSchedulingPanelProps = {
  scheduling: PatientScheduling | undefined;
  isLoading?: boolean;
  patientId: string;
  patientStatus: string;
  canWrite?: boolean;
  showPatientLink?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  isPausing?: boolean;
  isResuming?: boolean;
};

export function PatientSchedulingPanel({
  scheduling,
  isLoading,
  patientId,
  patientStatus,
  canWrite = false,
  showPatientLink = false,
  onPause,
  onResume,
  isPausing,
  isResuming,
}: PatientSchedulingPanelProps) {
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (!scheduling) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Agendamento indisponível.
      </div>
    );
  }

  const carePlans = scheduling.carePlans ?? (scheduling.carePlan ? [scheduling.carePlan] : []);

  const nextPending = scheduling.reminders
    .filter((r) => r.status === "Pending")
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0];

  const unconfirmedSent = scheduling.reminders.some(
    (r) => r.status === "Sent" && !r.wamId,
  );

  const hasAnySentReminder = scheduling.reminders.some((r) => r.status === "Sent");

  const firstSlotIsTomorrowOnly =
    nextPending &&
    new Date(nextPending.scheduledFor).toDateString() > new Date().toDateString() &&
    !hasAnySentReminder;

  return (
    <div id="agendamento" className="space-y-3 rounded-xl border p-4 text-sm scroll-mt-24">
      <div className="flex items-center gap-2 font-medium">
        <CalendarClock className="size-4" />
        Agendamento
      </div>

      {carePlans.length > 0 ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Medicamentos ({carePlans.length})</p>
          {carePlans.map((plan, idx) => (
            <div key={`${plan.medication}-${idx}`} className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p>
                <span className="font-medium text-foreground">{plan.medication}</span>
                {plan.dosage && <> · {plan.dosage}</>}
              </p>
              <p>Horários: {plan.scheduledTimes.replace(/,/g, ", ")}</p>
            </div>
          ))}
          {scheduling.activatedAt && (
            <p>Ativado em {formatDateTime(scheduling.activatedAt)}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum plano de cuidado ativo.</p>
      )}

      {nextPending ? (
        <div className="rounded-lg bg-muted/60 px-2 py-1.5 text-xs">
          <p className="font-medium text-foreground">Próximo lembrete</p>
          <p>{formatDateTime(nextPending.scheduledFor)}</p>
          {firstSlotIsTomorrowOnly && !unconfirmedSent && (
            <p className="mt-1 text-muted-foreground">
              O primeiro lembrete está agendado para amanhã — o texto de conclusão do cadastro deve refletir
              essa data.
            </p>
          )}
          {unconfirmedSent && (
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              Há lembrete marcado como enviado sem confirmação da Meta (sem ID WhatsApp). O paciente pode não
              ter recebido — verifique o número, a janela de 24h e o remetente de adesão em Configuração.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem lembretes pendentes.</p>
      )}

      {(showPatientLink || (canWrite && onPause) || (canWrite && onResume)) && (
        <div className="flex flex-wrap items-center gap-2">
          {showPatientLink && (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={`/pacientes/${patientId}#agendamento`}>
                <ExternalLink className="size-3.5" />
                Ficha do paciente
              </Link>
            </Button>
          )}
          {canWrite && patientStatus === "Active" && onPause && (
            <Button type="button" variant="outline" size="sm" disabled={isPausing} onClick={onPause}>
              <Pause className="size-3.5" />
              Pausar
            </Button>
          )}
          {canWrite && (patientStatus === "Paused" || patientStatus === "Reengagement") && onResume && (
            <Button type="button" variant="outline" size="sm" disabled={isResuming} onClick={onResume}>
              <Play className="size-3.5" />
              Retomar
            </Button>
          )}
        </div>
      )}

      {scheduling.pausedUntil && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Pausado até {formatDateTime(scheduling.pausedUntil)}
        </p>
      )}

      {(scheduling.consecutiveMissedCheckins ?? 0) >= 2 && (
        <p className="text-xs text-muted-foreground">
          {scheduling.consecutiveMissedCheckins} check-ins perdidos seguidos
        </p>
      )}

      {scheduling.openReengagementAttempt != null && (
        <p className="text-xs text-muted-foreground">
          Reengajamento em andamento — tentativa {scheduling.openReengagementAttempt}
          {scheduling.openReengagementSentAt && (
            <> · enviado {formatDateTime(scheduling.openReengagementSentAt)}</>
          )}
        </p>
      )}

      {scheduling.conversationStep && (
        <p className="text-xs text-muted-foreground">
          Etapa da conversa:{" "}
          <span className="font-medium text-foreground">
            {CONVERSATION_STEP_LABELS[scheduling.conversationStep] ?? scheduling.conversationStep}
          </span>
        </p>
      )}

      {hasUnconfirmedSentReminder(scheduling) && (
        <p className="text-xs text-destructive">
          Há lembretes marcados como enviados sem confirmação da Meta (sem WamId) — o paciente pode
          não ter recebido a mensagem.
        </p>
      )}

      {scheduling.reminders.some((r) => r.status === "Failed") && (
        <p className="text-xs text-destructive">
          Há lembretes com falha de envio — verifique a lista abaixo.
        </p>
      )}

      {scheduling.reminders.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
          {scheduling.reminders.slice(0, 12).map((r) => (
            <li key={r.id} className="flex flex-col gap-0.5">
              <div className="flex justify-between gap-2">
                <span>{formatDateTime(r.scheduledFor)}</span>
                <span
                  className={cn(
                    r.status === "Failed" && "text-destructive",
                    r.status === "Sent" && !r.wamId && "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {r.status === "Sent" && !r.wamId ? "Sent (não confirmado)" : r.status}
                </span>
              </div>
              {r.failureReason && <span className="text-destructive/80">{r.failureReason}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
