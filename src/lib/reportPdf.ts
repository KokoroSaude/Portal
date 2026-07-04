import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportPdfMetric {
  label: string;
  value: string;
}

export interface ReportPdfTable {
  title?: string;
  head: string[];
  body: string[][];
}

export interface ReportPdfChart {
  title?: string;
  dataUrl: string;
  widthMm?: number;
  heightMm?: number;
}

export interface ReportPdfSection {
  title: string;
  metrics?: ReportPdfMetric[];
  tables?: ReportPdfTable[];
  charts?: ReportPdfChart[];
}

export interface ReportPdfDocument {
  title: string;
  subtitle?: string;
  periodLabel: string;
  generatedAt: string;
  sections: ReportPdfSection[];
  filename: string;
}

const MARGIN = 14;
const PAGE_WIDTH = 210;
const HEAD_COLOR: [number, number, number] = [240, 106, 106];

type PdfWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } };

function ensureSpace(pdf: jsPDF, y: number, needed: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    pdf.addPage();
    return MARGIN;
  }
  return y;
}

function drawCharts(pdf: jsPDF, charts: ReportPdfChart[], startY: number): number {
  let y = startY;
  const defaultWidth = PAGE_WIDTH - MARGIN * 2;

  for (const chart of charts) {
    const widthMm = chart.widthMm ?? defaultWidth;
    const heightMm = chart.heightMm ?? widthMm * 0.45;
    y = ensureSpace(pdf, y, heightMm + 12);

    if (chart.title) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(chart.title, MARGIN, y);
      y += 5;
    }

    pdf.addImage(chart.dataUrl, "PNG", MARGIN, y, widthMm, heightMm);
    y += heightMm + 8;
  }

  return y;
}

function drawMetrics(pdf: jsPDF, metrics: ReportPdfMetric[], startY: number): number {
  let y = startY;
  const colWidth = (PAGE_WIDTH - MARGIN * 2) / 2;
  let col = 0;

  pdf.setFontSize(10);
  for (const metric of metrics) {
    const x = MARGIN + col * colWidth;
    pdf.setFont("helvetica", "bold");
    pdf.text(metric.label, x, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(metric.value, x, y + 4.5);
    col++;
    if (col >= 2) {
      col = 0;
      y += 12;
    }
  }
  if (col > 0) y += 12;
  return y;
}

export function downloadReportPdf(doc: ReportPdfDocument): void {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(0);
  pdf.text(doc.title, MARGIN, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  if (doc.subtitle) {
    pdf.text(doc.subtitle, MARGIN, y);
    y += 5;
  }
  pdf.text(`Período: ${doc.periodLabel}`, MARGIN, y);
  y += 5;
  pdf.text(`Gerado em: ${doc.generatedAt}`, MARGIN, y);
  y += 10;
  pdf.setTextColor(0);

  for (const section of doc.sections) {
    y = ensureSpace(pdf, y, 18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(section.title, MARGIN, y);
    y += 7;

    if (section.metrics?.length) {
      y = drawMetrics(pdf, section.metrics, y);
    }

    if (section.charts?.length) {
      y = drawCharts(pdf, section.charts, y);
    }

    for (const table of section.tables ?? []) {
      y = ensureSpace(pdf, y, 14);
      if (table.title) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(table.title, MARGIN, y);
        y += 5;
      }

      autoTable(pdf, {
        startY: y,
        head: [table.head],
        body: table.body,
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: HEAD_COLOR, textColor: 255 },
        alternateRowStyles: { fillColor: [252, 248, 248] },
      });

      y = (pdf as PdfWithAutoTable).lastAutoTable.finalY + 8;
    }
  }

  pdf.save(doc.filename);
}
