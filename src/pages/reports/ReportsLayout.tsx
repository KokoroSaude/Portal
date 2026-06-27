import { Outlet } from "react-router-dom";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { ReportRangePicker } from "@/components/reports/ReportsShared";
import { ReportRangeProvider, useReportRange } from "@/contexts/ReportRangeContext";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";

function ReportsLayoutContent() {
  const { hasFeature } = useAuth();
  const { range, setRange } = useReportRange();

  if (!hasFeature(FEATURE_KEYS.reportsBasic)) {
    return (
      <>
        <PageHeader title="Relatórios" description="Adesão e engajamento do programa" />
        <FeatureLocked
          title="Relatórios não disponíveis"
          description="Relatórios básicos não estão disponíveis para sua conta."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Adesão, engajamento e operação do programa de medicamentos"
      />
      <ReportRangePicker range={range} onChange={setRange} />
      <Outlet />
    </div>
  );
}

export function ReportsLayout() {
  return (
    <ReportRangeProvider>
      <ReportsLayoutContent />
    </ReportRangeProvider>
  );
}
