import type { ReportRange } from "@/contexts/ReportRangeContext";

/** YYYY-MM-DD in local calendar */
export function toDateOnly(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function defaultReportRange(): ReportRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toDateOnly(from), to: toDateOnly(to) };
}

export function reportRangeToApiParams(range: ReportRange): { from: string; to: string } {
  const fromDate = parseDateOnly(range.from) ?? new Date(range.from);
  const toDate = parseDateOnly(range.to) ?? new Date(range.to);
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export type ReportRangePreset = "7d" | "30d" | "90d" | "thisMonth" | "lastMonth" | "custom";

export function rangeFromPreset(preset: Exclude<ReportRangePreset, "custom">): ReportRange {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "90d":
      from.setDate(from.getDate() - 90);
      break;
    case "thisMonth":
      from.setDate(1);
      break;
    case "lastMonth": {
      from.setDate(1);
      from.setMonth(from.getMonth() - 1);
      to.setDate(0);
      break;
    }
  }

  return { from: toDateOnly(from), to: toDateOnly(to) };
}

export function detectRangePreset(range: ReportRange): ReportRangePreset {
  const presets: Exclude<ReportRangePreset, "custom">[] = [
    "7d",
    "30d",
    "90d",
    "thisMonth",
    "lastMonth",
  ];
  for (const preset of presets) {
    const expected = rangeFromPreset(preset);
    if (expected.from === range.from && expected.to === range.to) return preset;
  }
  return "custom";
}

export function isValidReportRange(range: ReportRange): boolean {
  const from = parseDateOnly(range.from);
  const to = parseDateOnly(range.to);
  if (!from || !to) return false;
  return from.getTime() <= to.getTime();
}

export function normalizeReportRange(range: ReportRange): ReportRange {
  if (isValidReportRange(range)) {
    return { from: range.from.slice(0, 10), to: range.to.slice(0, 10) };
  }
  return defaultReportRange();
}
