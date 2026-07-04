import type { ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { useReportRange } from "@/contexts/ReportRangeContext";
import { reportPathHasSearch, reportSearchPlaceholder } from "@/lib/reportNavigation";
import { cn } from "@/lib/utils";

type ReportsLayoutShellProps = {
  title: string;
  description: string;
  featureLocked?: { title: string; description: string } | null;
  scopeControl?: ReactNode;
  showToolbar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  children?: ReactNode;
};

function isReportsHubPath(pathname: string) {
  return pathname === "/relatorios" || pathname === "/admin/relatorios";
}

export function ReportsLayoutShell({
  title,
  description,
  featureLocked,
  scopeControl,
  showToolbar = true,
  showSearch,
  searchPlaceholder,
  children,
}: ReportsLayoutShellProps) {
  const location = useLocation();
  const { range, setRange, setPreset, searchQuery, setSearchQuery } = useReportRange();
  const onHub = isReportsHubPath(location.pathname);
  const toolbarVisible = showToolbar && !onHub && !featureLocked;
  const searchEnabled = showSearch ?? reportPathHasSearch(location.pathname);
  const searchLabel = searchPlaceholder ?? reportSearchPlaceholder(location.pathname);

  if (featureLocked) {
    return (
      <div className="space-y-4">
        <PageHeader title={title} description={description} />
        <FeatureLocked title={featureLocked.title} description={featureLocked.description} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", toolbarVisible && "pb-2")}>
      <PageHeader title={title} description={description} />
      {toolbarVisible && (
        <ReportToolbar
          range={range}
          onRangeChange={setRange}
          onPresetChange={setPreset}
          scopeControl={scopeControl}
          showSearch={searchEnabled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchLabel}
        />
      )}
      {children ?? <Outlet />}
    </div>
  );
}
