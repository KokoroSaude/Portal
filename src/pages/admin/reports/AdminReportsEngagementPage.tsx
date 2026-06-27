import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  EngagementBarChart,
  PatientFunnelChart,
} from "@/components/reports/ReportCharts";
import {
  AdminRankingTable,
  EngagementTable,
} from "@/components/reports/AdminReportsShared";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";

const ENGAGEMENT_TABS = ["engajamento", "cohort"] as const;
type EngagementTab = (typeof ENGAGEMENT_TABS)[number];

function isEngagementTab(value: string | null): value is EngagementTab {
  return ENGAGEMENT_TABS.includes(value as EngagementTab);
}

export function AdminReportsEngagementPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: EngagementTab = isEngagementTab(tabParam) ? tabParam : "engajamento";

  function setActiveTab(tab: EngagementTab) {
    if (tab === "engajamento") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  }

  const engagement = useQuery({
    queryKey: ["admin-engagement", range, tenantFilter],
    queryFn: () => api.adminGetEngagementReport(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  const funnel = useQuery({
    queryKey: ["admin-funnel", tenantFilter],
    queryFn: () => api.adminGetPatientFunnel(token!, tenantFilter),
    enabled: !!token && canFetch,
  });

  const rankingBest = useQuery({
    queryKey: ["admin-ranking-best", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, range.from, range.to, 10, false, tenantFilter),
    enabled: !!token && canFetch,
  });

  const rankingWorst = useQuery({
    queryKey: ["admin-ranking-worst", range, tenantFilter],
    queryFn: () => api.adminGetPatientRanking(token!, range.from, range.to, 10, true, tenantFilter),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Engajamento</h2>
        <p className="text-sm text-muted-foreground">
          Respostas por mensagem e funil de pacientes nas organizações selecionadas.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EngagementTab)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="engajamento">Engajamento</TabsTrigger>
          <TabsTrigger value="cohort">Funil e ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="engajamento">
          {engagement.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : engagement.data ? (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <EngagementBarChart
                  title="Por tipo de mensagem"
                  rows={engagement.data.byMessageKind}
                />
                <EngagementBarChart title="Por template" rows={engagement.data.byTemplate} />
              </div>
              <EngagementTable title="Detalhe por tipo" rows={engagement.data.byMessageKind} />
              <EngagementTable title="Detalhe por template" rows={engagement.data.byTemplate} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="cohort" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {funnel.isLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <PatientFunnelChart segments={funnel.data?.segments ?? []} />
            )}
            <AdminRankingTable
              title="Melhor adesão no período"
              rows={rankingBest.data}
              loading={rankingBest.isLoading}
            />
          </div>
          <AdminRankingTable
            title="Menor adesão no período"
            rows={rankingWorst.data}
            loading={rankingWorst.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
