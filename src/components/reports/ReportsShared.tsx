import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { ReportTableCard } from "@/components/reports/ReportTableCard";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { cn, formatPercent, maskPhone } from "@/lib/utils";
import type { MessageEngagement, NudgeEngagementRow } from "@/types/api";

/** @deprecated Use ReportToolbar via ReportsLayoutShell */
export function ReportRangePicker() {
  return null;
}

export function MetricCard({
  title,
  value,
  compact = true,
}: {
  title: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardHeader className={cn("pb-1", compact && "py-3")}>
        <CardDescription className="text-xs">{title}</CardDescription>
      </CardHeader>
      <CardContent className={cn(compact && "pt-0 pb-3")}>
        <p className={cn("font-serif", compact ? "text-2xl" : "text-3xl")}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function ComparisonCard({
  label,
  rate,
  checkins,
}: {
  label: string;
  rate: number;
  checkins: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1 py-3">
        <CardDescription className="text-xs">{label}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <p className="font-serif text-2xl">{formatPercent(rate)}</p>
        <p className="text-xs text-muted-foreground">{checkins} check-ins</p>
      </CardContent>
    </Card>
  );
}

export function RankingTable({
  title,
  rows,
  loading,
  searchQuery = "",
}: {
  title: string;
  rows?: {
    patientId: string;
    name: string | null;
    status: string;
    adherenceRate: number;
    totalCheckins: number;
  }[];
  loading: boolean;
  searchQuery?: string;
}) {
  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) =>
        matchesGridSearch(
          searchQuery,
          r.name,
          r.status,
          PATIENT_STATUS_LABELS[r.status],
          r.totalCheckins,
          formatPercent(r.adherenceRate),
        ),
      ),
    [searchQuery, rows],
  );

  return (
    <ReportTableCard
      title={title}
      description="Mínimo 3 check-ins no período"
      count={rows?.length}
    >
      {loading ? (
        <Skeleton className="h-32" />
      ) : !rows?.length ? (
        <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Adesão</TableHead>
              <TableHead>Check-ins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <GridEmptyRow colSpan={4} message="Nenhum paciente corresponde à busca." />
            )}
            {filtered.map((r) => (
              <TableRow key={r.patientId}>
                <TableCell>
                  <Link
                    to={`/pacientes/${r.patientId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.name ?? "Sem nome"}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {PATIENT_STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatPercent(r.adherenceRate)}</TableCell>
                <TableCell>{r.totalCheckins}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportTableCard>
  );
}

export function EngagementTable({
  title,
  rows,
  searchQuery = "",
}: {
  title: string;
  rows: MessageEngagement[];
  searchQuery?: string;
}) {
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesGridSearch(
          searchQuery,
          r.groupLabel,
          r.sent,
          r.responded,
          formatPercent(r.responseRate),
          r.avgResponseSeconds,
        ),
      ),
    [searchQuery, rows],
  );

  return (
    <ReportTableCard title={title} count={rows.length}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Enviados</TableHead>
              <TableHead>Respondidos</TableHead>
              <TableHead>Taxa</TableHead>
              <TableHead>Tempo médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <GridEmptyRow colSpan={5} message="Nenhum registro corresponde à busca." />
            )}
            {filtered.map((r) => (
              <TableRow key={r.groupLabel}>
                <TableCell>{r.groupLabel}</TableCell>
                <TableCell>{r.sent}</TableCell>
                <TableCell>{r.responded}</TableCell>
                <TableCell>{formatPercent(r.responseRate)}</TableCell>
                <TableCell>
                  {r.avgResponseSeconds != null ? `${Math.round(r.avgResponseSeconds)}s` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportTableCard>
  );
}

export function SendersPerformanceTable({
  rows,
  loading,
  searchQuery = "",
}: {
  rows: {
    senderId: string;
    displayName: string;
    phoneNumber: string;
    activePatients: number;
    checkinsTotal: number;
    adherenceRate: number;
  }[];
  loading: boolean;
  searchQuery?: string;
}) {
  const filtered = useMemo(
    () =>
      rows.filter((s) =>
        matchesGridSearch(
          searchQuery,
          s.displayName,
          s.phoneNumber,
          maskPhone(s.phoneNumber),
          s.activePatients,
          s.checkinsTotal,
          formatPercent(s.adherenceRate),
        ),
      ),
    [searchQuery, rows],
  );

  if (loading) return <Skeleton className="h-48" />;

  return (
    <ReportTableCard
      title="Performance por remetente"
      description="Números WhatsApp da organização no período"
      count={rows.length}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Cadastre remetentes em Configurações → WhatsApp.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ativos</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Adesão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <GridEmptyRow colSpan={5} message="Nenhum remetente corresponde à busca." />
            )}
            {filtered.map((s) => (
              <TableRow key={s.senderId}>
                <TableCell className="font-medium">{s.displayName}</TableCell>
                <TableCell className="font-mono text-xs">{maskPhone(s.phoneNumber)}</TableCell>
                <TableCell>{s.activePatients}</TableCell>
                <TableCell>{s.checkinsTotal}</TableCell>
                <TableCell>{formatPercent(s.adherenceRate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportTableCard>
  );
}

export function NudgeEngagementTable({
  title,
  rows,
  searchQuery = "",
}: {
  title: string;
  rows: NudgeEngagementRow[];
  searchQuery?: string;
}) {
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesGridSearch(
          searchQuery,
          r.groupLabel,
          r.groupKey,
          r.sent,
          r.respondedWithin2h,
          r.respondedWithin24h,
          formatPercent(r.responseRate2h),
          formatPercent(r.responseRate24h),
        ),
      ),
    [searchQuery, rows],
  );

  return (
    <ReportTableCard title={title} count={rows.length}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem nudges enviados no período.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Enviados</TableHead>
              <TableHead>Resp. 2h</TableHead>
              <TableHead>Taxa 2h</TableHead>
              <TableHead>Resp. 24h</TableHead>
              <TableHead>Taxa 24h</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <GridEmptyRow colSpan={6} message="Nenhum registro corresponde à busca." />
            )}
            {filtered.map((r) => (
              <TableRow key={r.groupKey}>
                <TableCell className="font-medium">{r.groupLabel}</TableCell>
                <TableCell>{r.sent}</TableCell>
                <TableCell>{r.respondedWithin2h}</TableCell>
                <TableCell>{formatPercent(r.responseRate2h)}</TableCell>
                <TableCell>{r.respondedWithin24h}</TableCell>
                <TableCell>{formatPercent(r.responseRate24h)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportTableCard>
  );
}
