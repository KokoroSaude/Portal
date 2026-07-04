import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import {
  AdherenceTrendChart,
  CheckinsByHourChart,
  EngagementBarChart,
  MoriskyLevelChart,
  MoriskyTrendChart,
  MoriskyTriggerChart,
  PatientFunnelChart,
  ResponseByDayChart,
  SimpleBarChart,
  TpbConstructChart,
  TpbTrendChart,
  TpbTriggerChart,
} from "@/components/reports/ReportCharts";
import type { ReportPdfChart } from "@/lib/reportPdf";
import type {
  AdherenceReport,
  AdherenceTrendPoint,
  AdminAdherenceReport,
  AdminEngagementReport,
  AdminMoriskyReport,
  AdminPatientFunnel,
  EngagementReport,
  MoriskyReport,
  PatientFunnel,
  TpbReport,
} from "@/types/api";

export type ReportPdfChartImages = Record<string, ReportPdfChart[]>;

const CAPTURE_DELAY_MS = 450;

async function captureReactNode(node: ReactNode): Promise<string> {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:680px;background:#ffffff;padding:0;";
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(node);
    });
    await new Promise((resolve) => setTimeout(resolve, CAPTURE_DELAY_MS));
    const target = (host.firstElementChild as HTMLElement | null) ?? host;
    const canvas = await html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } finally {
    root.unmount();
    host.remove();
  }
}

async function pushChart(
  bucket: ReportPdfChartImages,
  section: string,
  title: string,
  node: ReactNode,
) {
  const dataUrl = await captureReactNode(node);
  (bucket[section] ??= []).push({ title, dataUrl });
}

export async function captureTenantReportCharts(input: {
  features: {
    charts: boolean;
    advanced: boolean;
    cohort: boolean;
    morisky: boolean;
    tpb: boolean;
  };
  trend?: AdherenceTrendPoint[];
  adherence?: AdherenceReport;
  engagement?: EngagementReport;
  funnel?: PatientFunnel;
  morisky?: MoriskyReport;
  tpb?: TpbReport;
}): Promise<ReportPdfChartImages> {
  const images: ReportPdfChartImages = {};

  if (input.features.charts) {
    if (input.trend?.length) {
      await pushChart(
        images,
        "Adesão",
        "Evolução da adesão",
        <AdherenceTrendChart data={input.trend} />,
      );
    }
    if (input.adherence?.checkinsByHour.length) {
      await pushChart(
        images,
        "Adesão",
        "Check-ins por hora",
        <CheckinsByHourChart data={input.adherence.checkinsByHour} />,
      );
    }
    if (input.adherence?.avgResponseByDay.length) {
      await pushChart(
        images,
        "Adesão",
        "Tempo médio de resposta por dia",
        <ResponseByDayChart data={input.adherence.avgResponseByDay} />,
      );
    }
  }

  if (input.features.advanced && input.engagement) {
    if (input.engagement.byMessageKind.length) {
      await pushChart(
        images,
        "Engajamento",
        "Por tipo de mensagem",
        <EngagementBarChart title="Por tipo de mensagem" rows={input.engagement.byMessageKind} />,
      );
    }
    if (input.engagement.byTemplate.length) {
      await pushChart(
        images,
        "Engajamento",
        "Por template",
        <EngagementBarChart title="Por template" rows={input.engagement.byTemplate} />,
      );
    }
  }

  if (input.features.cohort && input.funnel?.segments.length) {
    await pushChart(
      images,
      "Funil de pacientes",
      "Funil de pacientes",
      <PatientFunnelChart segments={input.funnel.segments} />,
    );
  }

  if (input.features.morisky && input.morisky && input.morisky.totalAssessments > 0) {
    if (input.morisky.trend.length) {
      await pushChart(
        images,
        "MMAS-8 (Morisky)",
        "Tendência Morisky",
        <MoriskyTrendChart data={input.morisky.trend} />,
      );
    }
    if (input.morisky.byLevel.length) {
      await pushChart(
        images,
        "MMAS-8 (Morisky)",
        "Por nível",
        <MoriskyLevelChart data={input.morisky.byLevel} />,
      );
    }
    if (input.morisky.byTrigger.length) {
      await pushChart(
        images,
        "MMAS-8 (Morisky)",
        "Por gatilho",
        <MoriskyTriggerChart data={input.morisky.byTrigger} />,
      );
    }
  }

  if (input.features.tpb && input.tpb && input.tpb.totalAssessments > 0) {
    if (input.tpb.trend.length) {
      await pushChart(
        images,
        "TCP (Comportamento)",
        "Tendência TCP",
        <TpbTrendChart data={input.tpb.trend} />,
      );
    }
    if (input.tpb.byConstruct.length) {
      await pushChart(
        images,
        "TCP (Comportamento)",
        "Por construto",
        <TpbConstructChart data={input.tpb.byConstruct} />,
      );
    }
    if (input.tpb.byTrigger.length) {
      await pushChart(
        images,
        "TCP (Comportamento)",
        "Por gatilho",
        <TpbTriggerChart data={input.tpb.byTrigger} />,
      );
    }
  }

  return images;
}

export async function captureAdminReportCharts(input: {
  trend?: AdherenceTrendPoint[];
  adherence?: AdminAdherenceReport;
  engagement?: AdminEngagementReport;
  funnel?: AdminPatientFunnel;
  morisky?: AdminMoriskyReport;
}): Promise<ReportPdfChartImages> {
  const images: ReportPdfChartImages = {};

  if (input.trend?.length) {
    await pushChart(
      images,
      "Adesão consolidada",
      "Evolução da adesão",
      <AdherenceTrendChart data={input.trend} />,
    );
  }
  if (input.adherence?.checkinsByHour.length) {
    await pushChart(
      images,
      "Adesão consolidada",
      "Check-ins por hora",
      <CheckinsByHourChart data={input.adherence.checkinsByHour} />,
    );
  }
  if (input.adherence?.avgResponseByDay.length) {
    await pushChart(
      images,
      "Adesão consolidada",
      "Tempo médio de resposta por dia",
      <ResponseByDayChart data={input.adherence.avgResponseByDay} />,
    );
  }
  if (input.adherence?.byTenant.length) {
    await pushChart(
      images,
      "Adesão por organização",
      "Adesão por organização",
      <SimpleBarChart
        title="Adesão por organização"
        data={input.adherence.byTenant.map((t) => ({
          label: t.tenantName,
          value: Math.round(t.adherenceRate * 100),
        }))}
      />,
    );
  }
  if (input.engagement?.byMessageKind.length) {
    await pushChart(
      images,
      "Engajamento",
      "Por tipo de mensagem",
      <EngagementBarChart title="Por tipo de mensagem" rows={input.engagement.byMessageKind} />,
    );
  }
  if (input.funnel?.segments.length) {
    await pushChart(
      images,
      "Funil de pacientes",
      "Funil de pacientes",
      <PatientFunnelChart segments={input.funnel.segments} />,
    );
  }
  if (input.morisky && input.morisky.totalAssessments > 0 && input.morisky.byLevel.length) {
    await pushChart(
      images,
      "Morisky (MMAS)",
      "Por nível",
      <MoriskyLevelChart data={input.morisky.byLevel} />,
    );
  }

  return images;
}
