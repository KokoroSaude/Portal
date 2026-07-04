import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useReportFilters } from "@/hooks/useReportFilters";
import { reportRangeToApiParams, type ReportRangePreset } from "@/lib/reportRange";

export type ReportRange = { from: string; to: string };

export { defaultReportRange } from "@/lib/reportRange";

type ReportRangeContextValue = {
  range: ReportRange;
  setRange: (range: ReportRange) => void;
  setPreset: (preset: Exclude<ReportRangePreset, "custom">) => void;
  tab: string | null;
  setTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const ReportRangeContext = createContext<ReportRangeContextValue | null>(null);

export function ReportRangeProvider({ children }: { children: ReactNode }) {
  const filters = useReportFilters();

  return (
    <ReportRangeContext.Provider
      value={{
        range: filters.range,
        setRange: filters.setRange,
        setPreset: filters.setPreset,
        tab: filters.tab,
        setTab: filters.setTab,
        searchQuery: filters.searchQuery,
        setSearchQuery: filters.setSearchQuery,
      }}
    >
      {children}
    </ReportRangeContext.Provider>
  );
}

export function useReportRange() {
  const ctx = useContext(ReportRangeContext);
  if (!ctx) {
    throw new Error("useReportRange must be used within ReportRangeProvider");
  }
  return ctx;
}

/** ISO bounds for API calls from date-only range in context/URL */
export function useReportApiRange() {
  const { range } = useReportRange();
  return useMemo(() => reportRangeToApiParams(range), [range]);
}
