import { useQuery } from "@tanstack/react-query";
import { Clock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { PeriodicSurveyPatientCell, PeriodicSurveyTypeSummary } from "@/types/api";

type SurveyFilter = "all" | "csat" | "morisky" | "tpb";

type Props = {
  surveyFilter?: SurveyFilter;
  patientId?: string;
  limit?: number;
  compact?: boolean;
  className?: string;
};

const SURVEY_LABELS: Record<string, string> = {
  csat: "CSAT",
  morisky: "MMAS-8",
  tpb: "TCP",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "warning" {
  switch (status) {
    case "ready":
      return "default";
    case "waiting_slot":
      return "secondary";
    case "disabled":
      return "outline";
    default:
      return "warning";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Pronto agora";
    case "waiting_slot":
      return "Aguardando horário";
    case "blocked":
      return "Bloqueado";
    case "disabled":
      return "Desligado";
    default:
      return status;
  }
}

function SummaryTile({
  label,
  summary,
}: {
  label: string;
  summary: PeriodicSurveyTypeSummary;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Badge variant={summary.configured ? "default" : "outline"}>
          {summary.configured
            ? `A cada ${summary.periodicDays ?? "?"}d`
            : "Inativo"}
        </Badge>
      </div>
      {summary.disabledReason ? (
        <p className="text-xs text-muted-foreground">{summary.disabledReason}</p>
      ) : (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="text-primary font-medium">{summary.readyNowCount} prontos</span>
          <span>{summary.waitingSlotCount} aguardando horário</span>
          <span>{summary.blockedCount} bloqueados</span>
        </div>
      )}
    </div>
  );
}

function SurveyCellDetails({ cell }: { cell: PeriodicSurveyPatientCell }) {
  return (
    <div className="space-y-1 text-xs">
      <Badge variant={statusVariant(cell.status)}>{statusLabel(cell.status)}</Badge>
      {cell.dailySendSlotLocal ? (
        <p className="text-muted-foreground">Slot diário: {cell.dailySendSlotLocal}</p>
      ) : null}
      {cell.skipReason ? <p className="text-muted-foreground">{cell.skipReason}</p> : null}
      {cell.lastSentAtUtc ? (
        <p className="text-muted-foreground">
          Último: {formatDateTime(cell.lastSentAtUtc)}
        </p>
      ) : null}
      {cell.nextEligibleAtUtc ? (
        <p className="text-muted-foreground">
          Próximo: {formatDateTime(cell.nextEligibleAtUtc)}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsPeriodicSurveysStatusPanel({
  surveyFilter = "all",
  patientId,
  limit = 50,
  compact = false,
  className,
}: Props) {
  const { token, isAdmin } = useAuth();

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["periodic-survey-status", patientId ?? "tenant", surveyFilter, limit],
    queryFn: () =>
      api.getPeriodicSurveyStatus(token!, {
        patientId,
        limit,
      }),
    enabled: Boolean(token && isAdmin),
    refetchInterval: 30_000,
  });

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Envio automático</CardTitle>
          <CardDescription>Não foi possível carregar o status.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filterTypes =
    surveyFilter === "all" ? (["csat", "morisky", "tpb"] as const) : ([surveyFilter] as const);

  const filteredPatients = data.patients
    .map((row) => ({
      ...row,
      surveys: row.surveys.filter((s) =>
        filterTypes.includes(s.surveyType as (typeof filterTypes)[number]),
      ),
    }))
    .filter((row) => row.surveys.length > 0);

  if (compact && patientId) {
    const row = data.patients[0];
    if (!row) {
      return (
        <div className={cn("rounded-xl border border-dashed p-4 text-sm text-muted-foreground", className)}>
          Paciente não elegível para envio automático (status diferente de Ativo).
        </div>
      );
    }

    return (
      <div className={cn("space-y-3 rounded-xl border p-4 text-sm", className)}>
        <div className="flex items-center gap-2 font-medium">
          <Clock className="size-4" />
          Pesquisas automáticas
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {row.surveys
            .filter((s) =>
              filterTypes.includes(s.surveyType as (typeof filterTypes)[number]),
            )
            .map((cell) => (
              <div key={cell.surveyType} className="rounded-lg bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium text-foreground">
                  {SURVEY_LABELS[cell.surveyType] ?? cell.surveyType}
                </p>
                <SurveyCellDetails cell={cell} />
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Envio automático (CSAT · MMAS-8 · TCP)</CardTitle>
          <CardDescription>
            Worker verifica a cada {data.schedulerIntervalMinutes} min, dentro da janela{" "}
            {data.sendWindowStart}–{data.sendWindowEnd} (Brasília). Cada paciente tem um horário
            fixo no dia para evitar disparo em massa.
          </CardDescription>
          <p className="text-xs text-muted-foreground">
            Atualizado {formatDateTime(new Date(dataUpdatedAt).toISOString())}
            {data.withinSendWindowNow ? " · dentro da janela agora" : " · fora da janela agora"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("mr-2 size-4", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {surveyFilter === "all" ? (
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile label="CSAT" summary={data.csat} />
            <SummaryTile label="MMAS-8" summary={data.morisky} />
            <SummaryTile label="TCP" summary={data.tpb} />
          </div>
        ) : (
          <SummaryTile
            label={SURVEY_LABELS[surveyFilter] ?? surveyFilter}
            summary={
              surveyFilter === "csat"
                ? data.csat
                : surveyFilter === "morisky"
                  ? data.morisky
                  : data.tpb
            }
          />
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                {filterTypes.map((type) => (
                  <TableHead key={type}>{SURVEY_LABELS[type]}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={filterTypes.length + 1}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum paciente ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((row) => (
                  <TableRow key={row.patientId}>
                    <TableCell>
                      <Link
                        to={`/pacientes/${row.patientId}`}
                        className="font-medium hover:underline"
                      >
                        {row.patientName}
                      </Link>
                    </TableCell>
                    {filterTypes.map((type) => {
                      const cell = row.surveys.find((s) => s.surveyType === type);
                      return (
                        <TableCell key={type}>
                          {cell ? <SurveyCellDetails cell={cell} /> : "—"}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredPatients.length >= limit ? (
          <p className="text-xs text-muted-foreground">
            Mostrando até {limit} pacientes ativos. Veja o detalhe na ficha de cada paciente.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
