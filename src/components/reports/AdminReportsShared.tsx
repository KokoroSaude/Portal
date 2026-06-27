import { useMemo } from "react";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGridSearch } from "@/hooks/useGridSearch";
import { MORISKY_LEVEL_LABELS, MORISKY_TRIGGER_LABELS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import { matchesGridSearch } from "@/lib/gridSearch";
import { formatPercent, maskPhone } from "@/lib/utils";
import type { AdminMoriskyPatientRank } from "@/types/api";

export { ComparisonCard, EngagementTable, MetricCard, ReportRangePicker } from "@/components/reports/ReportsShared";

export function TenantMetricsTable({
  rows,
}: {
  rows: {
    tenantId: string;
    tenantName: string;
    totalCheckins: number;
    takenCount: number;
    missedCount: number;
    adherenceRate: number;
    activePatients: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Detalhe por organização</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organização</TableHead>
              <TableHead>Adesão</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Ativos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.tenantId}>
                <TableCell className="font-medium">{r.tenantName}</TableCell>
                <TableCell>{formatPercent(r.adherenceRate)}</TableCell>
                <TableCell>{r.totalCheckins}</TableCell>
                <TableCell>{r.activePatients}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function TraceabilityTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { id: string; when: string; type: string; detail: string; meta?: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead>Contexto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.when).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{row.detail || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.meta ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminRankingTable({
  title,
  rows,
  loading,
}: {
  title: string;
  rows?: {
    tenantName: string;
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
          r.tenantName,
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
            placeholder="Buscar organização, paciente ou status"
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
                <TableHead>Organização</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead>Check-ins</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={5} message="Nenhum registro corresponde à busca." />
              )}
              {filtered.map((r) => (
                <TableRow key={`${r.tenantName}-${r.patientId}`}>
                  <TableCell className="text-muted-foreground">{r.tenantName}</TableCell>
                  <TableCell className="font-medium">{r.name ?? "Sem nome"}</TableCell>
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

export function AdminSendersTable({
  rows,
  loading,
}: {
  rows: {
    tenantName: string;
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
          s.tenantName,
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
          <CardDescription>Números WhatsApp das organizações selecionadas</CardDescription>
        </div>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar organização, nome ou telefone"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum remetente ativo nas organizações selecionadas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ativos</TableHead>
                <TableHead>Check-ins</TableHead>
                <TableHead>Adesão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <GridEmptyRow colSpan={6} message="Nenhum remetente corresponde à busca." />
              )}
              {filtered.map((s) => (
                <TableRow key={s.senderId}>
                  <TableCell className="text-muted-foreground">{s.tenantName}</TableCell>
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

export function AdminMoriskyTriggerTable({
  rows,
}: {
  rows: { trigger: string; count: number; avgNormalizedScore: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Detalhe por gatilho</CardTitle>
        <CardDescription>Origem das avaliações Morisky no período</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gatilho</TableHead>
              <TableHead>Avaliações</TableHead>
              <TableHead>Score médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.trigger}>
                <TableCell>{MORISKY_TRIGGER_LABELS[r.trigger] ?? r.trigger}</TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell>{formatPercent(r.avgNormalizedScore)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function AdminMoriskyPatientRankingTable({ rows }: { rows: AdminMoriskyPatientRank[] }) {
  const { input, setInput, query } = useGridSearch();
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        matchesGridSearch(
          query,
          r.tenantName,
          r.patientName,
          r.phone,
          maskPhone(r.phone),
          r.level,
          MORISKY_LEVEL_LABELS[r.level],
          r.score,
          `${r.score}/${r.maxScore}`,
          r.checkinAdherenceRate != null ? formatPercent(r.checkinAdherenceRate) : "",
        ),
      ),
    [query, rows],
  );

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-serif text-lg">Ranking de pacientes</CardTitle>
          <CardDescription>Última avaliação Morisky por paciente no período</CardDescription>
        </div>
        {rows.length > 0 && (
          <GridSearchBar
            value={input}
            onChange={setInput}
            placeholder="Buscar organização, paciente ou telefone"
            resultCount={filtered.length}
            totalCount={rows.length}
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organização</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Adesão check-in</TableHead>
              <TableHead>Concluída em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <GridEmptyRow colSpan={7} message="Nenhum registro corresponde à busca." />
            )}
            {filtered.map((r) => (
              <TableRow key={`${r.tenantId}-${r.patientId}`}>
                <TableCell className="text-muted-foreground">{r.tenantName}</TableCell>
                <TableCell className="font-medium">{r.patientName ?? "Sem nome"}</TableCell>
                <TableCell className="font-mono text-xs">{maskPhone(r.phone)}</TableCell>
                <TableCell>
                  {r.score}/{r.maxScore}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {MORISKY_LEVEL_LABELS[r.level] ?? r.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.checkinAdherenceRate != null
                    ? formatPercent(r.checkinAdherenceRate)
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(r.completedAt).toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
