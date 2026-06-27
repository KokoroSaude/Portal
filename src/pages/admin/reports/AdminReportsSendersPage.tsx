import { useQuery } from "@tanstack/react-query";
import { AdminSendersTable } from "@/components/reports/AdminReportsShared";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";

export function AdminReportsSendersPage() {
  const { token } = useAuth();
  const { range } = useReportRange();
  const { tenantFilter, canFetch } = useAdminReportTenants();

  const senders = useQuery({
    queryKey: ["admin-senders", range, tenantFilter],
    queryFn: () => api.adminGetSenderPerformance(token!, range.from, range.to, tenantFilter),
    enabled: !!token && canFetch,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Remetentes</h2>
        <p className="text-sm text-muted-foreground">
          Performance por número WhatsApp nas organizações selecionadas.
        </p>
      </div>

      <AdminSendersTable rows={senders.data ?? []} loading={senders.isLoading} />
    </div>
  );
}
