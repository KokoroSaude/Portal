import { Badge } from "@/components/ui/badge";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "secondary" | "default"> = {
  Active: "success",
  Onboarding: "secondary",
  Paused: "warning",
  Reengagement: "default",
  Inactive: "muted",
  OptedOut: "muted",
};

export function PatientStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
      {PATIENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
