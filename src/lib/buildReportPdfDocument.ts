import { DOW_LABELS } from "@/components/reports/chartTheme";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import type {
  AdminAdherenceReport,
  AdminEngagementReport,
  AdminOperationsReport,
  AdminPatientAdherenceRank,
  AdminPatientFunnel,
  AdminPeriodComparison,
  AdminSenderPerformance,
  AdherenceReport,
  AdherenceTrendPoint,
  EngagementReport,
  MessageEngagement,
  OperationsReport,
  PatientAdherenceRank,
  PatientFunnel,
  PeriodComparison,
  SenderPerformance,
} from "@/types/api";
import { formatDate, formatDateTime, formatPercent, maskPhone } from "@/lib/utils";
import type { ReportPdfDocument, ReportPdfSection } from "@/lib/reportPdf";

function periodLabel(from: string, to: string) {
  return `${formatDate(from)} — ${formatDate(to)}`;
}

function pdfFilename(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.pdf`;
}

function engagementTable(title: string, rows: MessageEngagement[]) {
  return {
    title,
    head: ["Grupo", "Enviados", "Respondidos", "Taxa", "Tempo médio"],
    body: rows.map((r) => [
      r.groupLabel,
      String(r.sent),
      String(r.responded),
      formatPercent(r.responseRate),
      r.avgResponseSeconds != null ? `${Math.round(r.avgResponseSeconds)}s` : "—",
    ]),
  };
}

function adherenceExtrasSection(
  title: string,
  trend?: AdherenceTrendPoint[],
  adherence?: Pick<AdherenceReport, "checkinsByHour" | "avgResponseByDay">,
): ReportPdfSection | null {
  const tables = [];

  if (trend?.length) {
    tables.push({
      title: "Tendência diária",
      head: ["Data", "Tomados", "Perdidos", "Total", "Taxa"],
      body: trend.map((p) => [
        formatDate(p.date),
        String(p.taken),
        String(p.missed),
        String(p.total),
        formatPercent(p.rate),
      ]),
    });
  }

  if (adherence?.checkinsByHour.length) {
    tables.push({
      title: "Check-ins por hora",
      head: ["Hora", "Tomados", "Perdidos", "Taxa"],
      body: adherence.checkinsByHour.map((h) => [
        `${String(h.hour).padStart(2, "0")}h`,
        String(h.taken),
        String(h.missed),
        formatPercent(h.rate),
      ]),
    });
  }

  if (adherence?.avgResponseByDay.length) {
    tables.push({
      title: "Tempo médio de resposta por dia",
      head: ["Dia", "Tempo médio"],
      body: adherence.avgResponseByDay.map((d) => [
        DOW_LABELS[d.dayOfWeek] ?? d.dayOfWeek,
        `${Math.round(d.avgResponseSeconds)}s`,
      ]),
    });
  }

  if (!tables.length) return null;
  return { title, tables };
}

function funnelSection(funnel?: PatientFunnel | AdminPatientFunnel): ReportPdfSection | null {
  if (!funnel?.segments.length) return null;
  return {
    title: "Funil de pacientes",
    metrics: [{ label: "Total de pacientes", value: String(funnel.total) }],
    tables: [
      {
        head: ["Status", "Pacientes", "Participação"],
        body: funnel.segments.map((s) => [s.label, String(s.count), formatPercent(s.share)]),
      },
    ],
  };
}

function rankingSection(
  title: string,
  rows?: PatientAdherenceRank[] | AdminPatientAdherenceRank[],
  includeTenant = false,
): ReportPdfSection | null {
  if (!rows?.length) return null;

  const head = includeTenant
    ? ["Tenant", "Paciente", "Status", "Adesão", "Check-ins"]
    : ["Paciente", "Status", "Adesão", "Check-ins"];

  const body = rows.map((r) => {
    const base = [
      r.name ?? "Sem nome",
      PATIENT_STATUS_LABELS[r.status] ?? r.status,
      formatPercent(r.adherenceRate),
      String(r.totalCheckins),
    ];
    if (includeTenant && "tenantName" in r) {
      return [r.tenantName, ...base];
    }
    return base;
  });

  return { title, tables: [{ head, body }] };
}

export interface TenantReportPdfFeatures {
  charts: boolean;
  advanced: boolean;
  cohort: boolean;
  operations: boolean;
  bySender: boolean;
}

export interface TenantReportPdfInput {
  range: { from: string; to: string };
  orgName?: string;
  features: TenantReportPdfFeatures;
  adherence?: AdherenceReport;
  trend?: AdherenceTrendPoint[];
  engagement?: EngagementReport;
  funnel?: PatientFunnel;
  rankingBest?: PatientAdherenceRank[];
  rankingWorst?: PatientAdherenceRank[];
  operations?: OperationsReport;
  senders?: SenderPerformance[];
  comparison?: PeriodComparison;
}

export function buildTenantReportPdf(input: TenantReportPdfInput): ReportPdfDocument {
  const sections: ReportPdfSection[] = [];

  if (input.adherence) {
    const a = input.adherence;
    sections.push({
      title: "Adesão",
      metrics: [
        { label: "Taxa de adesão", value: formatPercent(a.adherenceRate) },
        { label: "Check-ins", value: String(a.totalCheckins) },
        { label: "Tomados", value: String(a.takenCount) },
        { label: "Perdidos", value: String(a.missedCount) },
        { label: "Pacientes ativos", value: String(a.activePatients) },
      ],
    });

    if (input.features.charts) {
      const extra = adherenceExtrasSection("Detalhes de adesão", input.trend, a);
      if (extra) sections.push(extra);
    }
  }

  if (input.features.advanced && input.engagement) {
    sections.push({
      title: "Engajamento",
      tables: [
        engagementTable("Por tipo de mensagem", input.engagement.byMessageKind),
        engagementTable("Por template", input.engagement.byTemplate),
      ],
    });
  }

  if (input.features.cohort) {
    const funnel = funnelSection(input.funnel);
    if (funnel) sections.push(funnel);

    const best = rankingSection("Melhor adesão no período", input.rankingBest);
    if (best) sections.push(best);

    const worst = rankingSection("Menor adesão no período", input.rankingWorst);
    if (worst) sections.push(worst);

    if (input.comparison) {
      const c = input.comparison;
      sections.push({
        title: "Comparativo de períodos",
        metrics: [
          {
            label: "Período atual",
            value: `${formatPercent(c.current.adherenceRate)} · ${c.current.totalCheckins} check-ins`,
          },
          {
            label: "Período anterior",
            value: `${formatPercent(c.previous.adherenceRate)} · ${c.previous.totalCheckins} check-ins`,
          },
          {
            label: "Variação de adesão",
            value: `${c.delta.adherenceRatePoints >= 0 ? "+" : ""}${(c.delta.adherenceRatePoints * 100).toFixed(1)} pp`,
          },
          {
            label: "Variação de check-ins",
            value: `${c.delta.totalCheckins >= 0 ? "+" : ""}${c.delta.totalCheckins}`,
          },
        ],
      });
    }
  }

  if (input.features.operations && input.operations) {
    const o = input.operations;
    sections.push({
      title: "Operação",
      metrics: [
        { label: "Lembretes enviados", value: String(o.reminders.sent) },
        { label: "Taxa de falha", value: formatPercent(o.reminders.failureRate) },
        { label: "Follow-ups", value: String(o.reminders.followupsSent) },
        { label: "Reativações", value: formatPercent(o.reengagements.reactivationRate) },
      ],
      tables: [
        {
          title: "Lembretes",
          head: ["Status", "Quantidade"],
          body: [
            ["Enviados", String(o.reminders.sent)],
            ["Falha", String(o.reminders.failed)],
            ["Pendentes", String(o.reminders.pending)],
            ["Ignorados", String(o.reminders.skipped)],
          ],
        },
        {
          title: "Reengajamento",
          head: ["Status", "Quantidade"],
          body: [
            ["Enviados", String(o.reengagements.sent)],
            ["Reativados", String(o.reengagements.reactivated)],
            ["Ignorados", String(o.reengagements.ignored)],
            ["Opt-out", String(o.reengagements.optedOut)],
            ["Pendentes", String(o.reengagements.pending)],
          ],
        },
      ],
    });
  }

  if (input.features.bySender && input.senders?.length) {
    sections.push({
      title: "Performance por remetente",
      tables: [
        {
          head: ["Nome", "Telefone", "Ativos", "Check-ins", "Adesão"],
          body: input.senders.map((s) => [
            s.displayName,
            maskPhone(s.phoneNumber),
            String(s.activePatients),
            String(s.checkinsTotal),
            formatPercent(s.adherenceRate),
          ]),
        },
      ],
    });
  }

  return {
    title: "Relatório Kokoro",
    subtitle: input.orgName,
    periodLabel: periodLabel(input.range.from, input.range.to),
    generatedAt: formatDateTime(new Date()),
    sections,
    filename: pdfFilename("relatorio-kokoro"),
  };
}

export interface AdminReportPdfInput {
  range: { from: string; to: string };
  tenantNames: string[];
  adherence?: AdminAdherenceReport;
  trend?: AdherenceTrendPoint[];
  engagement?: AdminEngagementReport;
  funnel?: AdminPatientFunnel;
  rankingBest?: AdminPatientAdherenceRank[];
  rankingWorst?: AdminPatientAdherenceRank[];
  operations?: AdminOperationsReport;
  senders?: AdminSenderPerformance[];
  comparison?: AdminPeriodComparison;
}

export function buildAdminReportPdf(input: AdminReportPdfInput): ReportPdfDocument {
  const sections: ReportPdfSection[] = [];
  const tenantSubtitle =
    input.tenantNames.length <= 3
      ? input.tenantNames.join(", ")
      : `${input.tenantNames.length} tenants selecionados`;

  if (input.adherence) {
    const a = input.adherence;
    sections.push({
      title: "Adesão consolidada",
      metrics: [
        { label: "Taxa de adesão", value: formatPercent(a.adherenceRate) },
        { label: "Check-ins", value: String(a.totalCheckins) },
        { label: "Tomados", value: String(a.takenCount) },
        { label: "Perdidos", value: String(a.missedCount) },
        { label: "Pacientes ativos", value: String(a.activePatients) },
      ],
    });

    const extra = adherenceExtrasSection("Detalhes de adesão", input.trend, a);
    if (extra) sections.push(extra);

    if (a.byTenant.length) {
      sections.push({
        title: "Adesão por tenant",
        tables: [
          {
            head: ["Tenant", "Adesão", "Check-ins", "Tomados", "Ativos"],
            body: a.byTenant.map((t) => [
              t.tenantName,
              formatPercent(t.adherenceRate),
              String(t.totalCheckins),
              String(t.takenCount),
              String(t.activePatients),
            ]),
          },
        ],
      });
    }
  }

  if (input.engagement) {
    sections.push({
      title: "Engajamento",
      tables: [
        engagementTable("Por tipo de mensagem", input.engagement.byMessageKind),
        engagementTable("Por template", input.engagement.byTemplate),
      ],
    });
  }

  const funnel = funnelSection(input.funnel);
  if (funnel) sections.push(funnel);

  const best = rankingSection("Melhor adesão no período", input.rankingBest, true);
  if (best) sections.push(best);

  const worst = rankingSection("Menor adesão no período", input.rankingWorst, true);
  if (worst) sections.push(worst);

  if (input.operations) {
    const o = input.operations;
    sections.push({
      title: "Operação",
      metrics: [
        { label: "Lembretes enviados", value: String(o.reminders.sent) },
        { label: "Taxa de falha", value: formatPercent(o.reminders.failureRate) },
        { label: "Follow-ups", value: String(o.reminders.followupsSent) },
        { label: "Reativações", value: formatPercent(o.reengagements.reactivationRate) },
      ],
      tables: [
        {
          title: "Lembretes",
          head: ["Status", "Quantidade"],
          body: [
            ["Enviados", String(o.reminders.sent)],
            ["Falha", String(o.reminders.failed)],
            ["Pendentes", String(o.reminders.pending)],
            ["Ignorados", String(o.reminders.skipped)],
          ],
        },
        {
          title: "Reengajamento",
          head: ["Status", "Quantidade"],
          body: [
            ["Enviados", String(o.reengagements.sent)],
            ["Reativados", String(o.reengagements.reactivated)],
            ["Ignorados", String(o.reengagements.ignored)],
            ["Opt-out", String(o.reengagements.optedOut)],
            ["Pendentes", String(o.reengagements.pending)],
          ],
        },
        ...(o.byTenant.length
          ? [
              {
                title: "Operação por tenant",
                head: ["Tenant", "Lembretes", "Falhas", "Reengajamentos", "Reativados"],
                body: o.byTenant.map((t) => [
                  t.tenantName,
                  String(t.remindersSent),
                  String(t.remindersFailed),
                  String(t.reengagementsSent),
                  String(t.reactivated),
                ]),
              },
            ]
          : []),
      ],
    });
  }

  if (input.senders?.length) {
    sections.push({
      title: "Performance por remetente",
      tables: [
        {
          head: ["Tenant", "Nome", "Telefone", "Ativos", "Check-ins", "Adesão"],
          body: input.senders.map((s) => [
            s.tenantName,
            s.displayName,
            maskPhone(s.phoneNumber),
            String(s.activePatients),
            String(s.checkinsTotal),
            formatPercent(s.adherenceRate),
          ]),
        },
      ],
    });
  }

  if (input.comparison) {
    const c = input.comparison;
    sections.push({
      title: "Comparativo de períodos",
      metrics: [
        {
          label: "Período atual",
          value: `${formatPercent(c.current.adherenceRate)} · ${c.current.totalCheckins} check-ins`,
        },
        {
          label: "Período anterior",
          value: `${formatPercent(c.previous.adherenceRate)} · ${c.previous.totalCheckins} check-ins`,
        },
        {
          label: "Variação de adesão",
          value: `${c.delta.adherenceRatePoints >= 0 ? "+" : ""}${(c.delta.adherenceRatePoints * 100).toFixed(1)} pp`,
        },
        {
          label: "Variação de check-ins",
          value: `${c.delta.totalCheckins >= 0 ? "+" : ""}${c.delta.totalCheckins}`,
        },
      ],
    });
  }

  return {
    title: "Relatório da plataforma",
    subtitle: tenantSubtitle,
    periodLabel: periodLabel(input.range.from, input.range.to),
    generatedAt: formatDateTime(new Date()),
    sections,
    filename: pdfFilename("relatorio-plataforma-kokoro"),
  };
}
