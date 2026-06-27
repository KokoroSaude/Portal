import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TraceabilityTable } from "@/components/reports/AdminReportsShared";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";

const TRACEABILITY_TABS = ["audit", "events"] as const;
type TraceabilityTab = (typeof TRACEABILITY_TABS)[number];

function isTraceabilityTab(value: string | null): value is TraceabilityTab {
  return TRACEABILITY_TABS.includes(value as TraceabilityTab);
}

export function AdminReportsTraceabilityPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TraceabilityTab = isTraceabilityTab(tabParam) ? tabParam : "audit";

  function setActiveTab(tab: TraceabilityTab) {
    if (tab === "audit") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  }

  const auditLog = useQuery({
    queryKey: ["admin-audit-log", range, tenantFilter],
    queryFn: () =>
      api.adminGetAuditLog(token!, {
        from: range.from,
        to: range.to,
        tenantIds: tenantFilter,
        limit: 50,
      }),
    enabled: !!token && canFetch,
  });

  const interactionEvents = useQuery({
    queryKey: ["admin-interaction-events", range, tenantFilter],
    queryFn: () =>
      api.adminGetInteractionEvents(token!, {
        from: range.from,
        to: range.to,
        tenantIds: tenantFilter,
        limit: 50,
      }),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Rastreabilidade</h2>
        <p className="text-sm text-muted-foreground">
          Audit log e eventos de interação no período selecionado.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TraceabilityTab)}>
        <TabsList>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="events">Interaction events</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          {auditLog.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <TraceabilityTable
              title="Audit log"
              description={`${auditLog.data?.total ?? 0} registros no período`}
              rows={(auditLog.data?.items ?? []).map((e) => ({
                id: e.id,
                when: e.createdAt,
                type: e.action,
                detail: `${e.entityName}${e.entityId ? ` · ${e.entityId.slice(0, 8)}` : ""}`,
                meta: e.userId ? `user ${e.userId.slice(0, 8)}` : undefined,
              }))}
            />
          )}
        </TabsContent>

        <TabsContent value="events">
          {interactionEvents.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <TraceabilityTable
              title="Interaction events"
              description={`${interactionEvents.data?.total ?? 0} eventos no período`}
              rows={(interactionEvents.data?.items ?? []).map((e) => ({
                id: e.id,
                when: e.occurredAt,
                type: e.eventType,
                detail: [
                  e.aiProvider && `${e.aiProvider}/${e.aiModel ?? "?"}`,
                  e.messageId && `msg ${e.messageId.slice(0, 8)}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
                meta: e.patientId ? `patient ${e.patientId.slice(0, 8)}` : undefined,
              }))}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
