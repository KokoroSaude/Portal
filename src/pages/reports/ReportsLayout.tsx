import { ReportsLayoutShell } from "@/components/reports/ReportsLayoutShell";
import { ReportRangeProvider } from "@/contexts/ReportRangeContext";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";

export function ReportsLayout() {
  const { hasFeature } = useAuth();

  return (
    <ReportRangeProvider>
      <ReportsLayoutShell
        title="Relatórios"
        description="Adesão, engajamento e operação do programa de medicamentos"
        featureLocked={
          !hasFeature(FEATURE_KEYS.reportsBasic)
            ? {
                title: "Relatórios não disponíveis",
                description: "Relatórios básicos não estão disponíveis para sua conta.",
              }
            : null
        }
      />
    </ReportRangeProvider>
  );
}
