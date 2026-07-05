import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MessageContentSourceBadge } from "@/components/messages/MessageContentSourceBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { timelineContentSource } from "@/lib/message-content-source";
import { formatDateTime } from "@/lib/utils";
import type { TimelineEventKind } from "@/types/api";

const STORAGE_KEY = "kokoro.timeline.filters";

const KIND_OPTIONS: { kind: TimelineEventKind; label: string }[] = [
  { kind: "message_inbound", label: "Mensagens recebidas" },
  { kind: "message_outbound", label: "Mensagens enviadas" },
  { kind: "reminder_sent", label: "Lembretes" },
  { kind: "followup_sent", label: "Follow-ups" },
  { kind: "checkin", label: "Check-ins" },
  { kind: "reengagement", label: "Reengajamento" },
];

const EVENT_LABELS: Record<TimelineEventKind, string> = {
  message_inbound: "Mensagem recebida",
  message_outbound: "Mensagem enviada",
  reminder_sent: "Lembrete enviado",
  reminder_scheduled: "Lembrete agendado",
  reminder_failed: "Lembrete falhou",
  followup_sent: "Follow-up enviado",
  checkin: "Check-in",
  reengagement: "Reengajamento",
};

const ALL_KINDS = KIND_OPTIONS.map((o) => o.kind);

function loadStoredKinds(): TimelineEventKind[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_KINDS;
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((k): k is TimelineEventKind =>
      ALL_KINDS.includes(k as TimelineEventKind),
    );
    return valid.length > 0 ? valid : ALL_KINDS;
  } catch {
    return ALL_KINDS;
  }
}

type Props = {
  token: string;
  patientId: string;
};

export function PatientTimelineCard({ token, patientId }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedKinds, setSelectedKinds] = useState<TimelineEventKind[]>(loadStoredKinds);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedKinds));
  }, [selectedKinds]);

  useEffect(() => {
    setPage(1);
  }, [selectedKinds, pageSize, patientId]);

  const kindsKey = useMemo(() => selectedKinds.slice().sort().join(","), [selectedKinds]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["patient-timeline", patientId, page, pageSize, kindsKey],
    queryFn: () =>
      api.getPatientTimeline(token, patientId, page, pageSize, selectedKinds),
    enabled: !!token && !!patientId && selectedKinds.length > 0,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  function toggleKind(kind: TimelineEventKind, checked: boolean) {
    setSelectedKinds((prev) => {
      if (checked) return prev.includes(kind) ? prev : [...prev, kind];
      const next = prev.filter((k) => k !== kind);
      return next.length === 0 ? prev : next;
    });
  }

  function selectAllKinds() {
    setSelectedKinds(ALL_KINDS);
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            Histórico completo do paciente (sem conteúdo sensível das mensagens). Mensagens enviadas
            exibem origem: IA, regras ou template.
          </CardDescription>
        </div>

        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exibir eventos
            </p>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllKinds}>
              Selecionar todos
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {KIND_OPTIONS.map(({ kind, label }) => (
              <label
                key={kind}
                className="flex cursor-pointer items-center gap-2 rounded-md border bg-background/70 px-2.5 py-2 text-sm"
              >
                <Checkbox
                  checked={selectedKinds.includes(kind)}
                  onCheckedChange={(checked) => toggleKind(kind, checked === true)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {selectedKinds.length === 0 ? (
          <p className="text-sm text-muted-foreground">Selecione ao menos um tipo de evento.</p>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento encontrado para os filtros selecionados.
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {data.items.map((ev, i) => (
                <li
                  key={`${ev.eventKind}-${ev.occurredAt}-${i}`}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {EVENT_LABELS[ev.eventKind as TimelineEventKind] ?? ev.eventKind}
                      </p>
                      {ev.eventKind === "message_outbound" && (
                        <MessageContentSourceBadge source={timelineContentSource(ev.meta)} />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ev.summary}</p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(ev.occurredAt)}
                  </time>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} de {data.total.toLocaleString("pt-BR")} eventos
                {isFetching && !isLoading ? " · atualizando…" : ""}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="timeline-page-size" className="sr-only">
                  Eventos por página
                </Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger id="timeline-page-size" className="h-8 w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / página</SelectItem>
                    <SelectItem value="20">20 / página</SelectItem>
                    <SelectItem value="50">50 / página</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
