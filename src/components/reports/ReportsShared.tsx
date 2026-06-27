import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
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
import { useGridSearch } from "@/hooks/useGridSearch";
import { PATIENT_STATUS_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatPercent, maskPhone } from "@/lib/utils";
import type { MessageEngagement, NudgeEngagementRow } from "@/types/api";
import type { ReportRange } from "@/contexts/ReportRangeContext";

export function ReportRangePicker({
  range,
  onChange,
}: {
  range: ReportRange;
  onChange: (r: ReportRange) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Período</CardTitle>
        <CardDescription>Filtro aplicado aos relatórios com data</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">De</Label>
          <Input
            id="from"
            type="date"
            value={range.from.slice(0, 10)}
            onChange={(e) =>
              onChange({ ...range, from: new Date(e.target.value).toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Até</Label>
          <Input
            id="to"
            type="date"
            value={range.to.slice(0, 10)}
            onChange={(e) => onChange({ ...range, to: new Date(e.target.value).toISOString() })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCard({ title, value }: { title: string; value: string | number }) {
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
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-2xl">{formatPercent(rate)}</p>
        <p className="text-sm text-muted-foreground">{checkins} check-ins</p>
      </CardContent>
    </Card>
  );
}

export function RankingTable({
  title,
  rows,
  loading,
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
}) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) =>
        matchesGridSearch(
          query,
          r.name,
          r.status,
          PATIENT_STATUS_LABELS[r.status],
          r.totalCheckins,
          formatPercent(r.adherenceRate),
        ),
      ),
    [query, rows],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-serif text-lg">{title}</CardTitle>
          <CardDescription>Mínimo 3 check-ins no período</CardDescription>
        </div>
        {!loading && (rows?.length ?? 0) > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar paciente ou status"
            resultCount={filtered.length}
            totalCount={rows?.length}
          />
        )}
      </CardHeader>
      <CardContent>
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
                    <Link to={`/pacientes/${r.patientId}`} className="font-medium text-primary hover:underline">
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
      </CardContent>
    </Card>
  );
}

export function EngagementTable({ title, rows }: { title: string; rows: MessageEngagement[] }) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesGridSearch(
          query,
          r.groupLabel,
          r.sent,
          r.responded,
          formatPercent(r.responseRate),
          r.avgResponseSeconds,
        ),
      ),
    [query, rows],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por grupo ou métrica"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

export function SendersPerformanceTable({
  rows,
  loading,
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
}) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      rows.filter((s) =>
        matchesGridSearch(
          query,
          s.displayName,
          s.phoneNumber,
          maskPhone(s.phoneNumber),
          s.activePatients,
          s.checkinsTotal,
          formatPercent(s.adherenceRate),
        ),
      ),
    [query, rows],
  );

  if (loading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-serif text-lg">Performance por remetente</CardTitle>
          <CardDescription>Números WhatsApp da organização no período</CardDescription>
        </div>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar por nome ou telefone"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

export function NudgeEngagementTable({ title, rows }: { title: string; rows: NudgeEngagementRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
              {rows.map((r) => (
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
      </CardContent>
    </Card>
  );
}
