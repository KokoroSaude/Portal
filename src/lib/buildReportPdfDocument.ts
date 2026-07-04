import { DOW_LABELS } from "@/components/reports/chartTheme";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import type {
  AdminAdherenceReport,
  AdminEngagementReport,
  AdminMoriskyReport,
  AdminOperationsReport,
  AdminPatientAdherenceRank,
  AdminPatientFunnel,
  AdminPeriodComparison,
  AdminSenderPerformance,
  AdherenceReport,
  AdherenceTrendPoint,
  EngagementReport,
  MessageEngagement,
  MoriskyReport,
  OperationsReport,
  PatientAdherenceRank,
  PatientFunnel,
  PeriodComparison,
  SenderPerformance,
  TpbReport,
  TpbRiskReport,
} from "@/types/api";
import { formatDate, formatDateTime, formatPercent, maskPhone } from "@/lib/utils";
import type { ReportPdfDocument, ReportPdfSection } from "@/lib/reportPdf";
import {
  MORISKY_LEVEL_LABELS,
  MORISKY_TRIGGER_LABELS,
  TPB_CONSTRUCT_LABELS,
  TPB_RISK_LABELS,
  TPB_TRIGGER_LABELS,
} from "@/lib/constants";

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
    ? ["Organização", "Paciente", "Status", "Adesão", "Check-ins"]
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

function tenantMoriskySection(morisky?: MoriskyReport): ReportPdfSection | null {
  if (!morisky || morisky.totalAssessments === 0) return null;

  const tables = [];

  if (morisky.byLevel.length) {
    tables.push({
      title: "Por nível de adesão",
      head: ["Nível", "Quantidade"],
      body: morisky.byLevel.map((l) => [
        MORISKY_LEVEL_LABELS[l.level] ?? l.level,
        String(l.count),
      ]),
    });
  }

  if (morisky.byTrigger.length) {
    tables.push({
      title: "Por gatilho",
      head: ["Gatilho", "Quantidade", "Score médio"],
      body: morisky.byTrigger.map((t) => [
        MORISKY_TRIGGER_LABELS[t.trigger] ?? t.trigger,
        String(t.count),
        formatPercent(t.avgNormalizedScore),
      ]),
    });
  }

  if (morisky.patientRanking.length) {
    tables.push({
      title: "Ranking de pacientes",
      head: ["Paciente", "Score", "Nível", "Última avaliação"],
      body: morisky.patientRanking.slice(0, 30).map((p) => [
        p.patientName ?? maskPhone(p.phone, p.phoneLast4),
        String(p.score),
        MORISKY_LEVEL_LABELS[p.level] ?? p.level,
        formatDate(p.completedAt),
      ]),
    });
  }

  return {
    title: "MMAS-8 (Morisky)",
    metrics: [
      { label: "Avaliações", value: String(morisky.totalAssessments) },
      { label: "Score normalizado médio", value: formatPercent(morisky.avgNormalizedScore) },
      { label: "Adesão check-in (período)", value: formatPercent(morisky.checkinAdherenceRate) },
    ],
    tables,
  };
}

function tenantTpbSection(tpb?: TpbReport, tpbRisk?: TpbRiskReport): ReportPdfSection | null {
  if (!tpb || tpb.totalAssessments === 0) return null;

  const tables = [];

  if (tpb.byConstruct.length) {
    tables.push({
      title: "Média por construto",
      head: ["Construto", "Média"],
      body: tpb.byConstruct.map((c) => [
        TPB_CONSTRUCT_LABELS[c.construct] ?? c.construct,
        `${c.avgScore.toFixed(1)}/5`,
      ]),
    });
  }

  if (tpb.byTrigger.length) {
    tables.push({
      title: "Por gatilho",
      head: ["Gatilho", "Quantidade", "Intenção média"],
      body: tpb.byTrigger.map((t) => [
        TPB_TRIGGER_LABELS[t.trigger] ?? t.trigger,
        String(t.count),
        `${t.avgIntentionScore.toFixed(1)}/5`,
      ]),
    });
  }

  if (tpb.patientRanking.length) {
    tables.push({
      title: "Ranking de pacientes",
      head: ["Paciente", "Intenção", "Última avaliação"],
      body: tpb.patientRanking.slice(0, 30).map((p) => [
        p.patientName ?? maskPhone(p.phone, p.phoneLast4),
        `${p.intentionScore.toFixed(1)}/5`,
        formatDate(p.completedAt),
      ]),
    });
  }

  const metrics = [
    { label: "Avaliações", value: String(tpb.totalAssessments) },
    { label: "Intenção média", value: `${tpb.avgIntentionScore.toFixed(1)}/5` },
    { label: "Adesão check-in (período)", value: formatPercent(tpb.checkinAdherenceRate) },
  ];

  if (tpbRisk && tpbRisk.totalScored > 0) {
    metrics.push(
      { label: "Pacientes com risco calculado", value: String(tpbRisk.totalScored) },
      { label: "Risco médio", value: formatPercent(tpbRisk.avgRiskScore) },
    );
    if (tpbRisk.distribution.length) {
      tables.push({
        title: "Distribuição de risco preditivo",
        head: ["Faixa", "Pacientes", "%"],
        body: tpbRisk.distribution.map((d) => [
          TPB_RISK_LABELS[d.label] ?? d.label,
          String(d.count),
          formatPercent(d.percentage),
        ]),
      });
    }
  }

  return { title: "TCP (Comportamento)", metrics, tables };
}

function adminMoriskySection(morisky?: AdminMoriskyReport): ReportPdfSection | null {
  if (!morisky || morisky.totalAssessments === 0) return null;

  const tables = [];

  if (morisky.byLevel.length) {
    tables.push({
      title: "Distribuição por nível",
      head: ["Nível", "Avaliações"],
      body: morisky.byLevel.map((l) => [
        MORISKY_LEVEL_LABELS[l.level] ?? l.level,
        String(l.count),
      ]),
    });
  }

  if (morisky.byTrigger.length) {
    tables.push({
      title: "Por gatilho",
      head: ["Gatilho", "Avaliações", "Score médio"],
      body: morisky.byTrigger.map((t) => [
        MORISKY_TRIGGER_LABELS[t.trigger] ?? t.trigger,
        String(t.count),
        formatPercent(t.avgNormalizedScore),
      ]),
    });
  }

  if (morisky.byTenant.length) {
    tables.push({
      title: "Por organização",
      head: ["Organização", "Avaliações", "Score médio", "Baixa adesão"],
      body: morisky.byTenant.map((t) => [
        t.tenantName,
        String(t.totalAssessments),
        formatPercent(t.avgNormalizedScore),
        String(t.lowCount),
      ]),
    });
  }

  if (morisky.patientRanking.length) {
    tables.push({
      title: "Ranking de pacientes",
      head: ["Organização", "Paciente", "Score", "Nível", "Adesão check-in", "Concluída em"],
      body: morisky.patientRanking.slice(0, 50).map((p) => [
        p.tenantName,
        p.patientName ?? "Sem nome",
        `${p.score}/${p.maxScore}`,
        MORISKY_LEVEL_LABELS[p.level] ?? p.level,
        p.checkinAdherenceRate != null ? formatPercent(p.checkinAdherenceRate) : "—",
        formatDateTime(p.completedAt),
      ]),
    });
  }

  return {
    title: "Morisky (MMAS)",
    metrics: [
      { label: "Avaliações", value: String(morisky.totalAssessments) },
      { label: "Score normalizado médio", value: formatPercent(morisky.avgNormalizedScore) },
      { label: "Adesão check-in (período)", value: formatPercent(morisky.checkinAdherenceRate) },
    ],
    tables,
  };
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
  morisky?: MoriskyReport;
  tpb?: TpbReport;
  tpbRisk?: TpbRiskReport;
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

  const moriskySec = tenantMoriskySection(input.morisky);
  if (moriskySec) sections.push(moriskySec);

  const tpbSec = tenantTpbSection(input.tpb, input.tpbRisk);
  if (tpbSec) sections.push(tpbSec);

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
  morisky?: AdminMoriskyReport;
}

export function buildAdminReportPdf(input: AdminReportPdfInput): ReportPdfDocument {
  const sections: ReportPdfSection[] = [];
  const tenantSubtitle =
    input.tenantNames.length <= 3
      ? input.tenantNames.join(", ")
      : `${input.tenantNames.length} organizações selecionadas`;

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
        title: "Adesão por organização",
        tables: [
          {
            head: ["Organização", "Adesão", "Check-ins", "Tomados", "Ativos"],
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
                title: "Operação por organização",
                head: ["Organização", "Lembretes", "Falhas", "Reengajamentos", "Reativados"],
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
          head: ["Organização", "Nome", "Telefone", "Ativos", "Check-ins", "Adesão"],
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

  const moriskySec = adminMoriskySection(input.morisky);
  if (moriskySec) sections.push(moriskySec);

  return {
    title: "Relatório da plataforma",
    subtitle: tenantSubtitle,
    periodLabel: periodLabel(input.range.from, input.range.to),
    generatedAt: formatDateTime(new Date()),
    sections,
    filename: pdfFilename("relatorio-plataforma-kokoro"),
  };
}
