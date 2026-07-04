import { AlertTriangle, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { PatientScheduling, PatientTenantSendWindow, PatientWhatsAppWindow } from "@/types/api";

type PatientWhatsAppWindowBannerProps = {
  whatsAppWindow?: PatientWhatsAppWindow | null;
  tenantSendWindow?: PatientTenantSendWindow | null;
  className?: string;
};

function resolveWhatsAppVariant(window: PatientWhatsAppWindow) {
  if (window.isOpen) {
    return {
      icon: CheckCircle2,
      container:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    };
  }

  if (window.canDeliverCheckinReminder) {
    return {
      icon: MessageCircle,
      container: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
      iconClass: "text-amber-600 dark:text-amber-400",
    };
  }

  return {
    icon: AlertTriangle,
    container: "border-destructive/40 bg-destructive/10 text-destructive dark:text-red-200",
    iconClass: "text-destructive",
  };
}

export function PatientWhatsAppWindowBanner({
  whatsAppWindow,
  tenantSendWindow,
  className,
}: PatientWhatsAppWindowBannerProps) {
  if (!whatsAppWindow) return null;

  const variant = resolveWhatsAppVariant(whatsAppWindow);
  const Icon = variant.icon;

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex gap-3 rounded-lg border px-4 py-3 text-sm",
          variant.container,
        )}
        role="status"
        aria-live="polite"
      >
        <Icon className={cn("mt-0.5 size-4 shrink-0", variant.iconClass)} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{whatsAppWindow.bannerTitle}</p>
          <p className="text-[13px] leading-snug opacity-90">{whatsAppWindow.bannerMessage}</p>
          {whatsAppWindow.lastInboundAtUtc && (
            <p className="text-xs opacity-75">
              Última mensagem recebida: {formatDateTime(whatsAppWindow.lastInboundAtUtc)}
            </p>
          )}
          {whatsAppWindow.isOpen && whatsAppWindow.expiresAtUtc && (
            <p className="text-xs opacity-75">
              Janela expira em {formatDateTime(whatsAppWindow.expiresAtUtc)}
            </p>
          )}
        </div>
      </div>

      {tenantSendWindow && !tenantSendWindow.isWithinSendWindowNow && (
        <div className="flex gap-3 rounded-lg border border-muted-foreground/25 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-foreground">{tenantSendWindow.bannerTitle}</p>
            <p className="text-xs leading-snug">{tenantSendWindow.bannerMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function hasUnconfirmedSentReminder(scheduling: PatientScheduling | undefined) {
  return scheduling?.reminders.some(
    (r) => r.status === "Sent" && !r.wamId,
  );
}
