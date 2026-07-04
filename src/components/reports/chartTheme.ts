export const CHART = {
  primary: "#F06A6A",
  primaryLight: "#F9A8A8",
  taken: "#10B981",
  missed: "#EF4444",
  muted: "#94A3B8",
  grid: "#E8E0E0",
} as const;

export const DOW_LABELS: Record<string, string> = {
  Sunday: "Dom",
  Monday: "Seg",
  Tuesday: "Ter",
  Wednesday: "Qua",
  Thursday: "Qui",
  Friday: "Sex",
  Saturday: "Sáb",
};

export const FUNNEL_COLORS = [
  CHART.primary,
  "#E85F5F",
  "#F9A8A8",
  "#FCA5A5",
  "#94A3B8",
  "#64748B",
];
