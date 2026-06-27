import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PatientTpbTab } from "@/components/patients/PatientTpbTab";
import { PatientSubPageShell } from "@/components/patients/PatientSubPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function PatientTpbPage() {
  const { id } = useParams<{ id: string }>();
  const { token, canWrite, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const tpbEnabled = hasFeature(FEATURE_KEYS.scalesTpb);
  const { settings: tenantSettings } = useTenantSettings();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: tpbHistory, isLoading: tpbLoading } = useQuery({
    queryKey: ["patient-tpb", id],
    queryFn: () => api.getPatientTpb(token!, id!),
    enabled: !!token && !!id && tpbEnabled,
  });

  const { data: tpbRisk, isLoading: tpbRiskLoading } = useQuery({
    queryKey: ["patient-tpb-risk", id],
    queryFn: () => api.getPatientTpbRisk(token!, id!),
    enabled: !!token && !!id && tpbEnabled,
  });

  const triggerTpbMutation = useMutation({
    mutationFn: () => api.triggerPatientTpb(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
      queryClient.invalidateQueries({ queryKey: ["patient-tpb", id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar TCP"),
  });

  const previewTpbMutation = useMutation({
    mutationFn: () => api.previewTpbIntervention(token!, id!),
    onSuccess: (result) => {
      toast.info(result.text, { duration: 8000 });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao simular intervenção"),
  });

  return (
    <PatientSubPageShell
      patientId={id}
      patientName={patient?.name}
      patientLoading={patientLoading}
      notFound={!patient}
      title="TCP"
      description="Histórico da Teoria do Comportamento Planejado, risco e intervenções do paciente."
      locked={!tpbEnabled}
      lockedTitle="TCP não disponível"
    >
      <PatientTpbTab
        assessments={tpbHistory?.assessments}
        risk={tpbRisk}
        isLoading={tpbLoading}
        riskLoading={tpbRiskLoading}
        canTrigger={canWrite}
        tpbEnabled={tenantSettings?.tpbEnabled}
        onTrigger={() => triggerTpbMutation.mutate()}
        isTriggering={triggerTpbMutation.isPending}
        onPreviewIntervention={canWrite ? () => previewTpbMutation.mutate() : undefined}
        isPreviewing={previewTpbMutation.isPending}
      />
    </PatientSubPageShell>
  );
}
