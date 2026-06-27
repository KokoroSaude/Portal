import { createContext, useContext, useState, type ReactNode } from "react";

export type ReportRange = { from: string; to: string };

export function defaultReportRange(): ReportRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

type ReportRangeContextValue = {
  range: ReportRange;
  setRange: (range: ReportRange) => void;
};

const ReportRangeContext = createContext<ReportRangeContextValue | null>(null);

export function ReportRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState(defaultReportRange);
  return (
    <ReportRangeContext.Provider value={{ range, setRange }}>
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
