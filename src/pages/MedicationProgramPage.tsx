import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FeatureLocked } from "@/components/PageHeader";
import { AdherenceTrendChart } from "@/components/reports/ReportCharts";
import { ReportSectionHeader } from "@/components/reports/ReportSectionNav";
import { ReportTableCard } from "@/components/reports/ReportTableCard";
import { MetricCard } from "@/components/reports/ReportsShared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useReportApiRange, useReportRange } from "@/contexts/ReportRangeContext";
import { api } from "@/lib/api";
import { FEATURE_KEYS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatPercent } from "@/lib/utils";
import type { MedicationSuggestion } from "@/types/api";

export function MedicationProgramPage() {
  const { token, hasFeature } = useAuth();
  const { searchQuery } = useReportRange();
  const { from, to } = useReportApiRange();
  const [medicationQuery, setMedicationQuery] = useState("");
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const canView = hasFeature(FEATURE_KEYS.reportsCohort);

  const suggestions = useQuery({
    queryKey: ["medication-suggestions", medicationQuery],
    queryFn: () => api.getMedicationSuggestions(token!, medicationQuery || undefined),
    enabled: !!token && canView && medicationQuery.length >= 2,
  });

  const report = useQuery({
    queryKey: ["medication-program", from, to, medicationQuery, selectedMedicationId],
    queryFn: () =>
      api.getMedicationProgramReport(token!, {
        medication: selectedMedicationId ? undefined : medicationQuery,
        medicationId: selectedMedicationId ?? undefined,
        from,
        to,
      }),
    enabled:
      !!token &&
      canView &&
      (selectedMedicationId !== null || medicationQuery.trim().length >= 2),
  });

  const filteredSuggestions = useMemo(() => {
    const items = suggestions.data ?? [];
    const q = medicationQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s: MedicationSuggestion) => s.label.toLowerCase().includes(q));
  }, [suggestions.data, medicationQuery]);

  const filterRow = (parts: (string | number | null | undefined)[]) =>
    matchesGridSearch(searchQuery, ...parts);

  if (!canView) {
    return (
      <FeatureLocked
        title="Relatório não disponível"
        description="O programa de medicamento requer o recurso de relatórios de cohort (plano Professional ou superior)."
      />
    );
  }

  return (
    <div className="space-y-4">
      <ReportSectionHeader
        title="Por medicamento"
        description="Escolha um medicamento e veja adesão da rede no período da barra acima."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base">Medicamento</CardTitle>
          <CardDescription>Busque por nome parcial ou selecione uma sugestão</CardDescription>
        </CardHeader>
        <CardContent className="relative max-w-xl space-y-2">
          <Input
            placeholder="Ex.: Ozempic, Metformina..."
            value={medicationQuery}
            onChange={(e) => {
              setMedicationQuery(e.target.value);
              setSelectedMedicationId(null);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-w-xl rounded-md border bg-popover shadow-md">
              {filteredSuggestions.map((item) => (
                <button
                  key={`${item.label}-${item.medicationId ?? "text"}`}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setMedicationQuery(item.label);
                    setSelectedMedicationId(item.medicationId);
                    setShowSuggestions(false);
                  }}
                >
                  <span>{item.label}</span>
                  {item.medicationId && <Badge variant="outline">Catálogo</Badge>}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {report.isLoading && <Skeleton className="h-48 w-full" />}

      {report.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Pacientes ativos" value={report.data.activePatients} />
            <MetricCard title="Adesão no período" value={formatPercent(report.data.adherenceRate)} />
            <MetricCard title="Check-ins" value={report.data.totalCheckins} />
            <MetricCard title="Planos ativos" value={report.data.activeCarePlans} />
          </div>

          <AdherenceTrendChart data={report.data.trend} />

          <ReportTableCard title="Por loja (WhatsApp)" count={report.data.bySender.length}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Pacientes</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Adesão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.bySender.filter((row) =>
                  filterRow([row.displayName, row.activePatients, row.checkinsTotal, row.adherenceRate]),
                ).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Nenhum dado corresponde à busca.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.data.bySender
                    .filter((row) =>
                      filterRow([
                        row.displayName,
                        row.activePatients,
                        row.checkinsTotal,
                        row.adherenceRate,
                      ]),
                    )
                    .map((row) => (
                      <TableRow key={row.senderId}>
                        <TableCell>{row.displayName}</TableCell>
                        <TableCell>{row.activePatients}</TableCell>
                        <TableCell>{row.checkinsTotal}</TableCell>
                        <TableCell>{formatPercent(row.adherenceRate)}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </ReportTableCard>

          <ReportTableCard title="Pacientes em risco" count={report.data.atRiskPatients.length}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Misses seguidos</TableHead>
                  <TableHead>Adesão período</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.atRiskPatients
                  .filter((p) => filterRow([p.name, p.senderName, p.consecutiveMissedCheckins]))
                  .map((p) => (
                    <TableRow key={p.patientId}>
                      <TableCell>{p.name ?? "—"}</TableCell>
                      <TableCell>{p.senderName ?? "—"}</TableCell>
                      <TableCell>{p.consecutiveMissedCheckins}</TableCell>
                      <TableCell>
                        {p.periodTotal > 0 ? formatPercent(p.periodAdherenceRate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/pacientes/${p.patientId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Ver paciente
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ReportTableCard>

          <ReportTableCard title="Ranking de adesão" count={report.data.ranking.length}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Adesão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.ranking
                  .filter((row) =>
                    filterRow([
                      row.name,
                      row.status,
                      PATIENT_STATUS_LABELS[row.status as keyof typeof PATIENT_STATUS_LABELS],
                      row.totalCheckins,
                      row.adherenceRate,
                    ]),
                  )
                  .map((row) => (
                    <TableRow key={row.patientId}>
                      <TableCell>{row.name ?? "—"}</TableCell>
                      <TableCell>
                        {PATIENT_STATUS_LABELS[row.status as keyof typeof PATIENT_STATUS_LABELS] ??
                          row.status}
                      </TableCell>
                      <TableCell>{row.totalCheckins}</TableCell>
                      <TableCell>{formatPercent(row.adherenceRate)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ReportTableCard>
        </>
      )}
    </div>
  );
}
