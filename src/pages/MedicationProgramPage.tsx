import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { AdherenceTrendChart } from "@/components/reports/ReportCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { api } from "@/lib/api";
import { FEATURE_KEYS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import type { MedicationSuggestion } from "@/types/api";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString() };
}

function ReportRangePicker({
  range,
  onChange,
}: {
  range: { from: string; to: string };
  onChange: (r: { from: string; to: string }) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Período</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="mp-from">De</Label>
          <Input
            id="mp-from"
            type="date"
            value={range.from.slice(0, 10)}
            onChange={(e) =>
              onChange({ ...range, from: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mp-to">Até</Label>
          <Input
            id="mp-to"
            type="date"
            value={range.to.slice(0, 10)}
            onChange={(e) => onChange({ ...range, to: new Date(e.target.value).toISOString() })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

export function MedicationProgramPage() {
  const { token, hasFeature } = useAuth();
  const [range, setRange] = useState(defaultRange);
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
    queryKey: ["medication-program", range, medicationQuery, selectedMedicationId],
    queryFn: () =>
      api.getMedicationProgramReport(token!, {
        medication: selectedMedicationId ? undefined : medicationQuery,
        medicationId: selectedMedicationId ?? undefined,
        from: range.from,
        to: range.to,
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

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader title="Programa de medicamento" description="Acompanhamento por medicamento na rede" />
        <FeatureLocked
          title="Relatório não disponível"
          description="O programa de medicamento requer o recurso de relatórios de cohort (plano Professional ou superior)."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programa de medicamento"
        description="Adesão consolidada e por filial para um medicamento da rede"
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Medicamento</CardTitle>
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

      <ReportRangePicker range={range} onChange={setRange} />

      {report.isLoading && <Skeleton className="h-48 w-full" />}

      {report.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Pacientes ativos" value={report.data.activePatients} />
            <MetricCard title="Adesão no período" value={formatPercent(report.data.adherenceRate)} />
            <MetricCard title="Check-ins" value={report.data.totalCheckins} />
            <MetricCard title="Planos ativos" value={report.data.activeCarePlans} />
          </div>

          <AdherenceTrendChart data={report.data.trend} />

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Por loja (WhatsApp)</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {report.data.bySender.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        Nenhum dado por loja no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.data.bySender.map((row) => (
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Pacientes em risco</CardTitle>
              <CardDescription>Misses consecutivos ou baixa adesão no período</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {report.data.atRiskPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Nenhum paciente em risco identificado
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.data.atRiskPatients.map((p) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-lg">Ranking de adesão</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {report.data.ranking.map((row) => (
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
