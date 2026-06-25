import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, MapPin, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PickupFeatureLocked } from "@/components/farmacia/PickupFeatureLocked";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api, ApiClientError } from "@/lib/api";
import { PICKUP_ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { PatientCareDelegate, PickupDashboardOrder } from "@/types/api";

const ACTIONABLE = new Set(["Allocated", "AwaitingPickup", "PatientArrived"]);

export function FarmaciaRetiradasPage() {
  const { token, canWrite } = useAuth();
  const queryClient = useQueryClient();
  const [rescheduleOrder, setRescheduleOrder] = useState<PickupDashboardOrder | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [arriveOrder, setArriveOrder] = useState<PickupDashboardOrder | null>(null);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string>("__owner__");
  const { pickupAccess: pickupEnabled } = useTenantSettings();

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["pickup-dashboard"],
    queryFn: () => api.getPickupDashboard(token!),
    enabled: !!token && pickupEnabled,
    refetchInterval: 15_000,
  });

  const { data: arriveDelegates = [], isLoading: delegatesLoading } = useQuery({
    queryKey: ["patient-delegates", arriveOrder?.patientId],
    queryFn: () => api.listPatientCareDelegates(token!, arriveOrder!.patientId),
    enabled: !!token && !!arriveOrder?.patientId,
  });

  const pickupDelegates = arriveDelegates.filter((d) => d.isActive && d.canPickup);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["pickup-dashboard"] });

  const arriveMutation = useMutation({
    mutationFn: ({ orderId, delegateId }: { orderId: string; delegateId?: string }) =>
      api.pickupArriveOrder(token!, orderId, delegateId),
    onSuccess: (result) => {
      const outside = result.outsidePickupWindow
        ? " — chegada fora da janela prevista"
        : "";
      toast.success(
        result.queuePassword
          ? `Chegada registrada — senha ${result.queuePassword}${outside}`
          : `Chegada registrada${outside}`,
        result.outsidePickupWindow ? { duration: 6000 } : undefined,
      );
      setArriveOrder(null);
      setSelectedDelegateId("__owner__");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao registrar chegada"),
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: string) => api.pickupCompleteOrder(token!, orderId),
    onSuccess: () => {
      toast.success("Retirada concluída");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao concluir retirada"),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.pickupCancelOrder(token!, orderId, "OperatorCancelled"),
    onSuccess: (result) => {
      toast.success(
        result.reallocated ? "Cancelada e vaga realocada" : "Ordem cancelada",
      );
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao cancelar"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({
      orderId,
      expectedPickupDate,
      windowStart: start,
      windowEnd: end,
    }: {
      orderId: string;
      expectedPickupDate: string;
      windowStart?: string;
      windowEnd?: string;
    }) =>
      api.pickupRescheduleOrder(token!, orderId, {
        expectedPickupDate,
        windowStart: start || undefined,
        windowEnd: end || undefined,
      }),
    onSuccess: () => {
      toast.success("Retirada reagendada");
      setRescheduleOrder(null);
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao reagendar"),
  });

  function openReschedule(order: PickupDashboardOrder) {
    setRescheduleOrder(order);
    setRescheduleDate(order.expectedPickupDate ?? "");
    setWindowStart("");
    setWindowEnd("");
  }

  function handleArriveClick(order: PickupDashboardOrder) {
    setArriveOrder(order);
    setSelectedDelegateId("__owner__");
  }

  function confirmArrive() {
    if (!arriveOrder) return;
    arriveMutation.mutate({
      orderId: arriveOrder.id,
      delegateId: selectedDelegateId === "__owner__" ? undefined : selectedDelegateId,
    });
  }

  if (!pickupEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Retiradas do dia" description="Fila operacional de atendimento" />
        <PickupFeatureLocked />
      </div>
    );
  }

  const orders = (dashboard?.todayOrders ?? []).filter(
    (o) => o.status !== "Completed" || o.completedAt,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retiradas do dia"
        description="Registre chegada, conclusão ou cancelamento de ordens"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Fila de atendimento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : isError ? (
            <QueryErrorState
              message="Não foi possível carregar a fila de retiradas."
              error={error}
              onRetry={() => void refetch()}
            />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ordem na fila hoje.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Janela</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Prioridade</TableHead>
                  {canWrite && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-muted-foreground">{order.priorityRank}</TableCell>
                    <TableCell className="font-medium">{order.patientName ?? "—"}</TableCell>
                    <TableCell>{order.medicationName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PICKUP_ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.expectedPickupDate
                        ? `${order.expectedPickupDate}${order.expectedPickupWindowLabel ? ` · ${order.expectedPickupWindowLabel}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono">{order.queuePassword ?? "—"}</TableCell>
                    <TableCell>{order.priorityScore}</TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ACTIONABLE.has(order.status) && order.status !== "PatientArrived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArriveClick(order)}
                              disabled={arriveMutation.isPending}
                            >
                              <MapPin className="mr-1 size-3.5" />
                              Chegou
                            </Button>
                          )}
                          {(order.status === "PatientArrived" ||
                            order.status === "AwaitingPickup") && (
                            <Button
                              size="sm"
                              onClick={() => completeMutation.mutate(order.id)}
                              disabled={completeMutation.isPending}
                            >
                              <CheckCircle2 className="mr-1 size-3.5" />
                              Concluir
                            </Button>
                          )}
                          {ACTIONABLE.has(order.status) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openReschedule(order)}
                              disabled={rescheduleMutation.isPending}
                            >
                              <CalendarClock className="mr-1 size-3.5" />
                              Reagendar
                            </Button>
                          )}
                          {ACTIONABLE.has(order.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelMutation.mutate(order.id)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="mr-1 size-3.5" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {orders.some((o) => o.readyNotifiedAt) && (
            <p className="mt-4 text-xs text-muted-foreground">
              Horários de aviso disponíveis na timeline de cada paciente.
              {orders[0]?.readyNotifiedAt &&
                ` Ex.: ${formatDateTime(orders.find((o) => o.readyNotifiedAt)?.readyNotifiedAt ?? null)}`}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rescheduleOrder} onOpenChange={(open) => !open && setRescheduleOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reagendar retirada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Nova data</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="window-start">Início da janela</Label>
                <Input
                  id="window-start"
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="window-end">Fim da janela</Label>
                <Input
                  id="window-end"
                  type="time"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe os horários em branco para usar a janela padrão da farmácia.
            </p>
            {rescheduleOrder && (
              <p className="text-sm text-muted-foreground">
                {rescheduleOrder.patientName} — {rescheduleOrder.medicationName}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOrder(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!rescheduleDate || rescheduleMutation.isPending}
              onClick={() =>
                rescheduleOrder &&
                rescheduleMutation.mutate({
                  orderId: rescheduleOrder.id,
                  expectedPickupDate: rescheduleDate,
                  windowStart: windowStart || undefined,
                  windowEnd: windowEnd || undefined,
                })
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!arriveOrder}
        onOpenChange={(open) => {
          if (!open) {
            setArriveOrder(null);
            setSelectedDelegateId("__owner__");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar chegada</DialogTitle>
            <DialogDescription>
              {arriveOrder
                ? `${arriveOrder.patientName ?? "Paciente"} — ${arriveOrder.medicationName}`
                : "Confirme quem está retirando o medicamento."}
            </DialogDescription>
          </DialogHeader>
          {delegatesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : pickupDelegates.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="arrive-delegate">Quem está retirando?</Label>
              <Select value={selectedDelegateId} onValueChange={setSelectedDelegateId}>
                <SelectTrigger id="arrive-delegate">
                  <SelectValue placeholder="Paciente titular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__owner__">Paciente titular</SelectItem>
                  {pickupDelegates.map((delegate: PatientCareDelegate) => (
                    <SelectItem key={delegate.id} value={delegate.id}>
                      {delegate.name}
                      {delegate.relationship ? ` (${delegate.relationship})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum representante cadastrado — a chegada será registrada para o paciente titular.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setArriveOrder(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmArrive} disabled={arriveMutation.isPending}>
              Confirmar chegada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
