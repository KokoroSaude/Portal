import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Pause, Pencil, Play, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { PatientAiInsightCard } from "@/components/patients/PatientAiInsightCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { formatDate, formatDateTime, maskPhone } from "@/lib/utils";
import type { CarePlanUpdate, TimelineEvent } from "@/types/api";

const EVENT_LABELS: Record<string, string> = {
  message_inbound: "Mensagem recebida",
  message_outbound: "Mensagem enviada",
  reminder_sent: "Lembrete enviado",
  checkin: "Check-in",
  followup: "Follow-up",
  reengagement: "Reengajamento",
};

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, canWrite } = useAuth();
  const queryClient = useQueryClient();
  const [pauseReason, setPauseReason] = useState("");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineItems, setTimelineItems] = useState<TimelineEvent[]>([]);
  const timelinePageSize = 20;
  const [carePlan, setCarePlan] = useState<CarePlanUpdate>({
    medication: "",
    dosage: "1 comprimido",
    scheduledTimes: "08:00",
    instructions: "",
  });

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["patient-timeline", id, timelinePage],
    queryFn: () => api.getPatientTimeline(token!, id!, timelinePage, timelinePageSize),
    enabled: !!token && !!id,
  });

  const hasMoreTimeline = (timeline?.length ?? 0) >= timelinePageSize;

  useEffect(() => {
    setTimelinePage(1);
    setTimelineItems([]);
  }, [id]);

  useEffect(() => {
    if (!timeline) return;
    setTimelineItems((prev) => (timelinePage === 1 ? timeline : [...prev, ...timeline]));
  }, [timeline, timelinePage]);

  const pauseMutation = useMutation({
    mutationFn: () => api.pausePatient(token!, id!, pauseReason || undefined),
    onSuccess: () => {
      toast.success("Paciente pausado");
      setPauseOpen(false);
      setPauseReason("");
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao pausar");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumePatient(token!, id!),
    onSuccess: () => {
      toast.success("Paciente reativado");
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao retomar");
    },
  });

  useEffect(() => {
    if (patient?.medication) {
      setCarePlan((cp) => ({ ...cp, medication: patient.medication ?? "" }));
    }
  }, [patient?.medication]);

  const carePlanMutation = useMutation({
    mutationFn: () => api.updateCarePlan(token!, id!, carePlan),
    onSuccess: () => {
      toast.success("Plano de cuidado atualizado");
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar plano");
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: () =>
      api.updatePatient(token!, id!, {
        phone: phoneInput.trim() || undefined,
        name: nameInput,
      }),
    onSuccess: () => {
      toast.success("Dados do paciente atualizados");
      setPhoneOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar");
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: () => api.deletePatient(token!, id!),
    onSuccess: () => {
      toast.success("Paciente excluído");
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      navigate("/pacientes");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao excluir paciente");
    },
  });

  useEffect(() => {
    if (patient) {
      setPhoneInput(patient.phone);
      setNameInput(patient.name ?? "");
    }
  }, [patient]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!patient) {
    return (
      <div className="space-y-4">
        <Link to="/pacientes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <p className="text-destructive">Paciente não encontrado.</p>
      </div>
    );
  }

  const canPause = patient.status === "Active" || patient.status === "Onboarding";
  const canResume = patient.status === "Paused";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/pacientes" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Pacientes
          </Link>
          <h1 className="font-serif text-3xl">{patient.name ?? "Sem nome"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <PatientStatusBadge status={patient.status} />
            <span className="font-mono text-sm text-muted-foreground">{maskPhone(patient.phone)}</span>
            {canWrite && (
              <Dialog open={phoneOpen} onOpenChange={setPhoneOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Pencil className="size-3" />
                    Editar WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>WhatsApp do paciente</DialogTitle>
                    <DialogDescription>
                      Atualize se o paciente trocou de número. Deve ser o mesmo usado no WhatsApp.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Telefone (E.164)</Label>
                      <Input
                        id="edit-phone"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+5511999999999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Nome</Label>
                      <Input
                        id="edit-name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => updatePatientMutation.mutate()}
                      disabled={!phoneInput.trim() || updatePatientMutation.isPending}
                    >
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={canWrite ? "default" : "outline"}
            asChild
          >
            <Link to={`/whatsapp/conversas?patientId=${id}`}>
              <MessageCircle className="size-4" />
              {canWrite ? "Enviar mensagem" : "Ver conversa"}
            </Link>
          </Button>
          {canWrite && canPause && (
            <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pause className="size-4" />
                  Pausar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pausar paciente</DialogTitle>
                  <DialogDescription>
                    O paciente não receberá lembretes até ser reativado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Input
                    id="reason"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="Ex.: viagem, internação"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPauseOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
                    Confirmar pausa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canWrite && canResume && (
            <Button
              size="sm"
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
            >
              <Play className="size-4" />
              Retomar
            </Button>
          )}
          {canWrite && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4" />
                  Excluir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir paciente</DialogTitle>
                  <DialogDescription>
                    Esta ação remove permanentemente {patient.name ?? "este paciente"}, incluindo
                    mensagens, plano de cuidado, check-ins e todo o histórico. Não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deletePatientMutation.mutate()}
                    disabled={deletePatientMutation.isPending}
                  >
                    Excluir permanentemente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medicamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{patient.medication ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Último check-in</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDateTime(patient.lastCheckinAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cadastro</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(patient.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      {token && id && <PatientAiInsightCard token={token} patientId={id} />}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="careplan">Plano de cuidado</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Eventos recentes (sem conteúdo sensível de mensagens)</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : timelineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {timelineItems.map((ev, i) => (
                      <li
                        key={`${ev.occurredAt}-${i}`}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {EVENT_LABELS[ev.eventKind] ?? ev.eventKind}
                          </p>
                          <p className="text-sm text-muted-foreground">{ev.summary}</p>
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(ev.occurredAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                  {hasMoreTimeline && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimelinePage((p) => p + 1)}
                        disabled={timelineLoading}
                      >
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="careplan">
          <Card>
            <CardHeader>
              <CardTitle>Plano de cuidado</CardTitle>
              <CardDescription>Medicamento, dosagem e horários de lembrete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Medicamento</Label>
                  <Input
                    value={carePlan.medication}
                    onChange={(e) => setCarePlan((c) => ({ ...c, medication: e.target.value }))}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosagem</Label>
                  <Input
                    value={carePlan.dosage}
                    onChange={(e) => setCarePlan((c) => ({ ...c, dosage: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Horários (HH:mm separados por vírgula)</Label>
                  <Input
                    placeholder="08:00,20:00"
                    value={carePlan.scheduledTimes}
                    onChange={(e) => setCarePlan((c) => ({ ...c, scheduledTimes: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Instruções</Label>
                  <Textarea
                    value={carePlan.instructions ?? ""}
                    onChange={(e) => setCarePlan((c) => ({ ...c, instructions: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={() => carePlanMutation.mutate()} disabled={carePlanMutation.isPending || !canWrite}>
                <Save className="size-4" />
                Salvar plano
              </Button>
              {!canWrite && (
                <p className="text-sm text-muted-foreground">
                  Seu perfil é somente leitura e não pode editar o plano de cuidado.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
