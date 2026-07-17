import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PatientCareDelegatesSection } from "@/components/patients/PatientCareDelegatesSection";
import { PatientCaregiversSection } from "@/components/patients/PatientCaregiversSection";
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
      description="Cuidadores de adesão (retail) e delegados de retirada (gov)."
      locked={false}
    >
      {token && id && (
        <div className="space-y-6">
          <PatientCaregiversSection patientId={id} token={token} canWrite={canWrite} />
          {govMode ? (
            <PatientCareDelegatesSection patientId={id} token={token} canWrite={canWrite} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Delegados de retirada SUS ficam disponíveis quando o módulo de farmácia governamental
              está ativo.
            </p>
          )}
        </div>
      )}
    </PatientSubPageShell>
  );
}
