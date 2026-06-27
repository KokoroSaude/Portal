import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PatientCareDelegatesSection } from "@/components/patients/PatientCareDelegatesSection";
import { PatientSubPageShell } from "@/components/patients/PatientSubPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api } from "@/lib/api";

export function PatientCareNetworkPage() {
  const { id } = useParams<{ id: string }>();
  const { token, canWrite } = useAuth();
  const { govMode } = useTenantSettings();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  return (
    <PatientSubPageShell
      patientId={id}
      patientName={patient?.name}
      patientLoading={patientLoading}
      notFound={!patient}
      title="Rede de cuidado"
      description="Delegados autorizados a retirar medicamentos e receber notificações."
      locked={!govMode}
      lockedTitle="Rede de cuidado não disponível"
      lockedDescription="Este recurso está disponível apenas para operações de farmácia governamental."
    >
      {token && id && (
        <PatientCareDelegatesSection patientId={id} token={token} canWrite={canWrite} />
      )}
    </PatientSubPageShell>
  );
}
