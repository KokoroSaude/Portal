import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComplianceHubPanel } from "@/components/compliance/ComplianceHubPanel";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";
import { api } from "@/lib/api";
import type { TenantSettings } from "@/types/api";

function overviewToSettings(
  overview: Awaited<ReturnType<typeof api.adminGetTenantComplianceOverview>>,
): TenantSettings {
  return {
    sendWindowStart: "08:00",
    sendWindowEnd: "20:00",
    followupAfterHours: 24,
    maxReengagementAttempts: 3,
    inactiveDaysBeforeReengagement: 7,
    voiceTone: 0,
    locale: "pt-BR",
    aiEnabled: overview.aiEnabled,
    aiApprovedByController: overview.aiApprovedByController,
    aiApprovedAt: overview.aiApprovedAt,
    aiApprovalReference: overview.aiApprovalReference,
    adminTwoFactorRequired: overview.adminTwoFactorRequired,
    dataRetentionDays: overview.dataRetentionDays,
    voiceMessagesEnabled: false,
    moriskyEnabled: false,
    moriskyOnOnboarding: false,
    moriskyPeriodicDays: null,
    moriskyTriggerAfterMisses: null,
    moriskyCooldownDays: 30,
    tpbEnabled: false,
    tpbOnOnboarding: false,
    tpbPeriodicDays: null,
    tpbTriggerAfterMisses: null,
    tpbCooldownDays: 30,
    onboardingResumeEnabled: true,
    onboardingResumeAfterDays: 2,
    onboardingResumeCooldownHours: 24,
  };
}

export function AdminCompliancePage() {
  const { token } = useAuth();
  const { tenants, isLoading: tenantsLoading } = useActiveAdminTenants();
  const [tenantId, setTenantId] = useState<string>("");

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === tenantId),
    [tenants, tenantId],
  );

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["admin-compliance-overview", tenantId],
    queryFn: () => api.adminGetTenantComplianceOverview(token!, tenantId),
    enabled: !!token && !!tenantId,
  });

  const settings = overview ? overviewToSettings(overview) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacidade e conformidade"
        description="Documentação do piloto, status por organização e exportações para due diligence (ex.: Unimed CNU)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organização</CardTitle>
          <CardDescription>
            Escolha a organização para ver status de IA, 2FA e exportar a trilha de auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={tenantId || undefined}
            onValueChange={setTenantId}
            disabled={tenantsLoading || tenants.length === 0}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder={tenantsLoading ? "Carregando…" : "Selecionar organização"} />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {token && (
        <ComplianceHubPanel
          token={token}
          settings={settings}
          settingsLoading={!!tenantId && overviewLoading}
          tenantLabel={selectedTenant?.name ?? overview?.tenantName ?? null}
          documentsQueryKey={["admin-compliance-documents"]}
          fetchDocuments={() => api.adminGetComplianceDocuments(token)}
          fetchDocument={(slug) => api.adminGetComplianceDocument(token, slug)}
          exportAudit={async () => {
            if (!tenantId) throw new Error("Selecione uma organização");
            const to = new Date();
            const from = new Date();
            from.setDate(from.getDate() - 90);
            return api.adminGetAuditLog(token, {
              from: from.toISOString(),
              to: to.toISOString(),
              tenantIds: [tenantId],
              limit: 10_000,
            });
          }}
          showDsarHint
        />
      )}
    </div>
  );
}
