import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ReportRange } from "@/contexts/ReportRangeContext";
import {
  defaultReportRange,
  normalizeReportRange,
  type ReportRangePreset,
  rangeFromPreset,
} from "@/lib/reportRange";

export type ReportFilters = {
  range: ReportRange;
  tab: string | null;
  searchQuery: string;
};

export function useReportFilters(defaultTab?: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const range = useMemo(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) return normalizeReportRange({ from, to });
    return defaultReportRange();
  }, [searchParams]);

  const tab = searchParams.get("tab") ?? defaultTab ?? null;
  const searchQuery = searchParams.get("q") ?? "";

  const patchParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value == null || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setRange = useCallback(
    (next: ReportRange) => {
      patchParams({ from: next.from.slice(0, 10), to: next.to.slice(0, 10) });
    },
    [patchParams],
  );

  const setPreset = useCallback(
    (preset: Exclude<ReportRangePreset, "custom">) => {
      const next = rangeFromPreset(preset);
      setRange(next);
    },
    [setRange],
  );

  const setTab = useCallback(
    (value: string) => {
      patchParams({ tab: value });
    },
    [patchParams],
  );

  const setSearchQuery = useCallback(
    (value: string) => {
      patchParams({ q: value.trim() || null });
    },
    [patchParams],
  );

  return {
    range,
    tab,
    searchQuery,
    setRange,
    setPreset,
    setTab,
    setSearchQuery,
  };
}
