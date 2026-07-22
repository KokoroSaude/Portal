import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import { SimpleBarChart } from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { ReportSectionNav } from "@/components/reports/ReportSectionNav";
import { MetricCard, SendersPerformanceTable } from "@/components/reports/ReportsShared";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { resolveReportTab } from "@/lib/reportNavigation";
import { formatPercent } from "@/lib/utils";

export function ReportsOperationsPage() {
  const { token, hasFeature } = useAuth();
  const { tab, setTab, searchQuery } = useReportRange();
  const { from, to } = useReportApiRange();

  const operations = useQuery({
    queryKey: ["operations-report", from, to],
    queryFn: () => api.getOperationsReport(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsOperations),
  });

  const senders = useQuery({
    queryKey: ["sender-performance", from, to],
    queryFn: () => api.getSenderPerformance(token!, from, to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsBySender),
  });

  if (!hasFeature(FEATURE_KEYS.reportsOperations) && !hasFeature(FEATURE_KEYS.reportsBySender)) {
    return (
      <FeatureLocked
        title="Relatórios operacionais não disponíveis"
        description="Este recurso não está incluído no seu plano atual."
      />
    );
  }

  const navItems = [
    { value: "operations", label: "Operação", hidden: !hasFeature(FEATURE_KEYS.reportsOperations) },
    { value: "senders", label: "Remetentes", hidden: !hasFeature(FEATURE_KEYS.reportsBySender) },
  ];
  const defaultTab = hasFeature(FEATURE_KEYS.reportsOperations) ? "operations" : "senders";
  const activeTab = resolveReportTab(
    tab,
    defaultTab,
    navItems.filter((i) => !i.hidden).map((i) => i.value),
  );

  return (
    <div className="space-y-4">
      <ReportSectionNav items={navItems} value={activeTab} onChange={setTab} />

      {activeTab === "operations" && hasFeature(FEATURE_KEYS.reportsOperations) && (
        <>
          {operations.isLoading ? (
            <Skeleton className="h-48" />
          ) : operations.isError ? (
            <QueryErrorState
              message="Não foi possível carregar o relatório operacional."
              error={operations.error}
              onRetry={() => operations.refetch()}
            />
          ) : operations.data ? (
            <div className="space-y-4">
              {token && (
                <ReportAiInsightCard token={token} from={from} to={to} variant="operations" />
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Lembretes enviados" value={operations.data.reminders.sent} />
                <MetricCard
                  title="Taxa de falha"
                  value={formatPercent(operations.data.reminders.failureRate)}
                />
                <MetricCard title="Follow-ups" value={operations.data.reminders.followupsSent} />
                <MetricCard
                  title="Reativações"
                  value={formatPercent(operations.data.reengagements.reactivationRate)}
                />
              </div>
              {hasFeature(FEATURE_KEYS.reportsCharts) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <SimpleBarChart
                    title="Lembretes"
                    description="Status no período"
                    data={[
                      { label: "Enviados", value: operations.data.reminders.sent },
                      { label: "Falha", value: operations.data.reminders.failed },
                      { label: "Pendentes", value: operations.data.reminders.pending },
                      { label: "Ignorados", value: operations.data.reminders.skipped },
                    ]}
                  />
                  <SimpleBarChart
                    title="Reengajamento"
                    data={[
                      { label: "Reativados", value: operations.data.reengagements.reactivated },
                      { label: "Ignorados", value: operations.data.reengagements.ignored },
                      { label: "Opt-out", value: operations.data.reengagements.optedOut },
                      { label: "Pendentes", value: operations.data.reengagements.pending },
                    ]}
                  />
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {activeTab === "senders" && hasFeature(FEATURE_KEYS.reportsBySender) && (
        <div className="space-y-4">
          {token && (
            <ReportAiInsightCard token={token} from={from} to={to} variant="senders" />
          )}
          <SendersPerformanceTable
            rows={senders.data ?? []}
            loading={senders.isLoading}
            searchQuery={searchQuery}
          />
        </div>
      )}
    </div>
  );
}
