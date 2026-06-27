import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PatientMoriskyTab } from "@/components/patients/PatientMoriskyTab";
import { PatientSubPageShell } from "@/components/patients/PatientSubPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function PatientMoriskyPage() {
  const { id } = useParams<{ id: string }>();
  const { token, canWrite, hasFeature } = useAuth();
  const moriskyEnabled = hasFeature(FEATURE_KEYS.scalesMorisky);
  const { settings: tenantSettings } = useTenantSettings();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: moriskyHistory, isLoading: moriskyLoading } = useQuery({
    queryKey: ["patient-morisky", id],
    queryFn: () => api.getPatientMorisky(token!, id!),
    enabled: !!token && !!id && moriskyEnabled,
  });

  const triggerMoriskyMutation = useMutation({
    mutationFn: () => api.triggerPatientMorisky(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar MMAS-8"),
  });

  return (
    <PatientSubPageShell
      patientId={id}
      patientName={patient?.name}
      patientLoading={patientLoading}
      notFound={!patient}
      title="MMAS-8"
      description="Histórico de avaliações de adesão medicamentosa (Morisky) do paciente."
      locked={!moriskyEnabled}
      lockedTitle="MMAS-8 não disponível"
    >
      <PatientMoriskyTab
        assessments={moriskyHistory?.assessments}
        isLoading={moriskyLoading}
        canTrigger={canWrite}
        moriskyEnabled={tenantSettings?.moriskyEnabled}
        onTrigger={() => triggerMoriskyMutation.mutate()}
        isTriggering={triggerMoriskyMutation.isPending}
      />
    </PatientSubPageShell>
  );
}
