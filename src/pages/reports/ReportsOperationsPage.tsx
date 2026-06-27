import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import { SimpleBarChart } from "@/components/reports/ReportCharts";
import { ReportAiInsightCard } from "@/components/reports/ReportAiInsightCard";
import { MetricCard, SendersPerformanceTable } from "@/components/reports/ReportsShared";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";

export function ReportsOperationsPage() {
  const { token, hasFeature } = useAuth();
  const { range } = useReportRange();

  const operations = useQuery({
    queryKey: ["operations-report", range],
    queryFn: () => api.getOperationsReport(token!, range.from, range.to),
    enabled: !!token && hasFeature(FEATURE_KEYS.reportsOperations),
  });

  const senders = useQuery({
    queryKey: ["sender-performance", range],
    queryFn: () => api.getSenderPerformance(token!, range.from, range.to),
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

  return (
    <Tabs defaultValue={hasFeature(FEATURE_KEYS.reportsOperations) ? "operations" : "senders"}>
      <TabsList className="flex h-auto flex-wrap gap-1">
        {hasFeature(FEATURE_KEYS.reportsOperations) && (
          <TabsTrigger value="operations">Operação</TabsTrigger>
        )}
        {hasFeature(FEATURE_KEYS.reportsBySender) && (
          <TabsTrigger value="senders">Remetentes</TabsTrigger>
        )}
      </TabsList>

      {hasFeature(FEATURE_KEYS.reportsOperations) && (
        <TabsContent value="operations" className="space-y-6">
          {operations.isLoading ? (
            <Skeleton className="h-48" />
          ) : operations.data ? (
            <>
              {token && (
                <ReportAiInsightCard
                  token={token}
                  from={range.from}
                  to={range.to}
                  variant="operations"
                />
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="grid gap-6 lg:grid-cols-2">
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
            </>
          ) : null}
        </TabsContent>
      )}

      {hasFeature(FEATURE_KEYS.reportsBySender) && (
        <TabsContent value="senders">
          {token && (
            <div className="mb-6">
              <ReportAiInsightCard
                token={token}
                from={range.from}
                to={range.to}
                variant="senders"
              />
            </div>
          )}
          <SendersPerformanceTable rows={senders.data ?? []} loading={senders.isLoading} />
        </TabsContent>
      )}
    </Tabs>
  );
}
