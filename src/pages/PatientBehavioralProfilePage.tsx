import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { PatientBehavioralTab } from "@/components/patients/PatientBehavioralTab";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function PatientBehavioralProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { token, canWrite, hasFeature } = useAuth();
  const behavioralEnabled = hasFeature(FEATURE_KEYS.behavioralProfile);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: behavioralProfile, isLoading: behavioralProfileLoading } = useQuery({
    queryKey: ["patient-behavioral-profile", id],
    queryFn: () => api.getPatientBehavioralProfile(token!, id!),
    enabled: !!token && !!id && behavioralEnabled,
  });

  const { data: tpbRisk, isLoading: tpbRiskLoading } = useQuery({
    queryKey: ["patient-tpb-risk", id],
    queryFn: () => api.getPatientTpbRisk(token!, id!),
    enabled: !!token && !!id && behavioralEnabled && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  if (!behavioralEnabled) {
    return (
      <>
        <Link
          to={id ? `/pacientes/${id}` : "/pacientes"}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao paciente
        </Link>
        <PageHeader
          title="Avaliação estratégica"
          description="Perfil comportamental e barreiras de adesão."
        />
        <FeatureLocked
          title="Perfil comportamental não disponível"
          description="Este recurso não está incluído no seu plano atual."
        />
      </>
    );
  }

  if (patientLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!patient || !token || !id) {
    return (
      <div className="space-y-4">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <p className="text-destructive">Paciente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/pacientes/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {patient.name ?? "Paciente"}
      </Link>

      <PageHeader
        title="Avaliação estratégica"
        description="Perfil comportamental, barreiras de adesão e questionário estratégico do paciente."
      />

      <PatientBehavioralTab
        token={token}
        patientId={id}
        canWrite={canWrite}
        profile={behavioralProfile}
        profileLoading={behavioralProfileLoading}
        tpbRisk={tpbRisk}
        tpbRiskLoading={tpbRiskLoading}
      />
    </div>
  );
}
