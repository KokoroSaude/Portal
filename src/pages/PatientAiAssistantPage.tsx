import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PatientAiInsightCard } from "@/components/patients/PatientAiInsightCard";
import { PatientKokoroAssistantCard } from "@/components/patients/PatientKokoroAssistantCard";
import {
  PatientInsightPreviewModeToggle,
  type InsightPreviewMode,
} from "@/components/patients/PatientInsightPreviewModeToggle";
import { PatientInsightPromptDialog } from "@/components/patients/PatientInsightPromptDialog";
import { PatientSubPageShell } from "@/components/patients/PatientSubPageShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

export function PatientAiAssistantPage() {
  const { id } = useParams<{ id: string }>();
  const { token, canWrite, hasFeature, isPlatform, isAdmin } = useAuth();
  const [insightPreviewMode, setInsightPreviewMode] = useState<InsightPreviewMode>("auto");
  const aiEnabled = hasFeature(FEATURE_KEYS.aiCopilot);

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const {
    settings: tenantSettings,
    isLoading: settingsLoading,
    isError: settingsError,
  } = useTenantSettings();

  const { data: platformAi } = useQuery({
    queryKey: ["admin-platform-ai"],
    queryFn: () => api.adminGetPlatformAi(token!),
    enabled: !!token && isPlatform && aiEnabled,
  });

  const platformConfiguredOverride = platformAi?.isConfigured;

  const triggerTpbMutation = useMutation({
    mutationFn: () => api.triggerPatientTpb(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar TCP"),
  });

  return (
    <PatientSubPageShell
      patientId={id}
      patientName={patient?.name}
      patientLoading={patientLoading}
      notFound={!patient}
      title="Assistente IA"
      description="Resumo clínico, sugestões de acompanhamento e insights personalizados do paciente."
      locked={!aiEnabled}
      lockedTitle="Assistente IA não disponível"
    >
      {token && id && isAdmin && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Preview resumo (admin)</span>
          <PatientInsightPreviewModeToggle
            value={insightPreviewMode}
            onChange={setInsightPreviewMode}
          />
          <PatientInsightPromptDialog token={token} patientId={id} />
        </div>
      )}

      <PatientAiInsightCard
        token={token!}
        patientId={id!}
        tenantSettings={tenantSettings}
        platformConfiguredOverride={platformConfiguredOverride}
        previewMode={insightPreviewMode}
      />

      <PatientKokoroAssistantCard
        token={token!}
        patientId={id!}
        canWrite={canWrite}
        tenantSettings={tenantSettings}
        platformConfiguredOverride={platformConfiguredOverride}
        previewMode={insightPreviewMode}
        onTriggerTpb={() => triggerTpbMutation.mutate()}
      />

      {(settingsLoading || settingsError) && (
        <p className="text-xs text-muted-foreground">
          {settingsError
            ? "Não foi possível carregar as configurações de IA do tenant."
            : "Carregando configurações de IA…"}
        </p>
      )}
    </PatientSubPageShell>
  );
}
