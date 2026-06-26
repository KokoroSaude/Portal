import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Pause, Pencil, Play, RefreshCw, Star, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { Badge } from "@/components/ui/badge";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import { PatientAiInsightCard } from "@/components/patients/PatientAiInsightCard";
import { PatientKokoroAssistantCard } from "@/components/patients/PatientKokoroAssistantCard";
import {
  PatientInsightPreviewModeToggle,
  type InsightPreviewMode,
} from "@/components/patients/PatientInsightPreviewModeToggle";
import { PatientInsightPromptDialog } from "@/components/patients/PatientInsightPromptDialog";
import { PatientCarePlansTab } from "@/components/patients/PatientCarePlansTab";
import { PatientCareDelegatesSection } from "@/components/patients/PatientCareDelegatesSection";
import { PatientDsarExportButton } from "@/components/patients/PatientDsarExportButton";
import { PatientMoriskyTab } from "@/components/patients/PatientMoriskyTab";
import { PatientTpbTab } from "@/components/patients/PatientTpbTab";
import { PatientBehavioralTab } from "@/components/patients/PatientBehavioralTab";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, CLINICAL_PRIORITY_TIER_LABELS } from "@/lib/constants";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { formatDate, formatDateTime, maskPhone } from "@/lib/utils";
import { formatCpfDisplay, stripCpf } from "@/lib/cpf";
import type { ClinicalPriorityTier, TimelineEvent } from "@/types/api";

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
  const { token, canWrite, hasFeature, isPlatform, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [insightPreviewMode, setInsightPreviewMode] = useState<InsightPreviewMode>("auto");
  const [pauseReason, setPauseReason] = useState("");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cpfInput, setCpfInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<ClinicalPriorityTier>("Normal");
  const [channelInput, setChannelInput] = useState<"Text" | "Audio">("Text");
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineItems, setTimelineItems] = useState<TimelineEvent[]>([]);
  const timelinePageSize = 20;

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const voiceFeatureEnabled = hasFeature(FEATURE_KEYS.whatsappVoice);

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["patient-timeline", id, timelinePage],
    queryFn: () => api.getPatientTimeline(token!, id!, timelinePage, timelinePageSize),
    enabled: !!token && !!id,
  });

  const { data: moriskyHistory, isLoading: moriskyLoading } = useQuery({
    queryKey: ["patient-morisky", id],
    queryFn: () => api.getPatientMorisky(token!, id!),
    enabled: !!token && !!id && hasFeature(FEATURE_KEYS.scalesMorisky),
  });

  const { data: achievements } = useQuery({
    queryKey: ["patient-achievements", id],
    queryFn: () => api.getPatientAchievements(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: tpbHistory, isLoading: tpbLoading } = useQuery({
    queryKey: ["patient-tpb", id],
    queryFn: () => api.getPatientTpb(token!, id!),
    enabled: !!token && !!id && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  const { data: tpbRisk, isLoading: tpbRiskLoading } = useQuery({
    queryKey: ["patient-tpb-risk", id],
    queryFn: () => api.getPatientTpbRisk(token!, id!),
    enabled: !!token && !!id && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  const behavioralEnabled = hasFeature(FEATURE_KEYS.behavioralProfile);

  const { data: behavioralProfile, isLoading: behavioralProfileLoading } = useQuery({
    queryKey: ["patient-behavioral-profile", id],
    queryFn: () => api.getPatientBehavioralProfile(token!, id!),
    enabled: !!token && !!id && behavioralEnabled,
  });

  const {
    settings: tenantSettings,
    govMode,
    isLoading: settingsLoading,
    isError: settingsError,
  } = useTenantSettings();

  const voiceTenantEnabled = tenantSettings?.voiceMessagesEnabled ?? false;
  const canSetAudioChannel = voiceFeatureEnabled && voiceTenantEnabled;

  const { data: platformAi } = useQuery({
    queryKey: ["admin-platform-ai"],
    queryFn: () => api.adminGetPlatformAi(token!),
    enabled: !!token && isPlatform && hasFeature(FEATURE_KEYS.aiCopilot),
  });

  const platformConfiguredOverride = platformAi?.isConfigured;

  const triggerMoriskyMutation = useMutation({
    mutationFn: () => api.triggerPatientMorisky(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar MMAS-8"),
  });

  const triggerTpbMutation = useMutation({
    mutationFn: () => api.triggerPatientTpb(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
      queryClient.invalidateQueries({ queryKey: ["patient-tpb", id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar TCP"),
  });

  const previewTpbMutation = useMutation({
    mutationFn: () => api.previewTpbIntervention(token!, id!),
    onSuccess: (result) => {
      toast.info(result.text, { duration: 8000 });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao simular intervenção"),
  });

  const triggerCsatMutation = useMutation({
    mutationFn: () => api.triggerPatientCsat(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar pesquisa de satisfação"),
  });

  const triggerOnboardingResumeMutation = useMutation({
    mutationFn: () => api.triggerOnboardingResume(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar lembrete de cadastro"),
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

  const updatePatientMutation = useMutation({
    mutationFn: () =>
      api.updatePatient(token!, id!, {
        phone: phoneInput.trim() || undefined,
        name: nameInput,
        cpf: cpfInput.trim() === "" ? "" : stripCpf(cpfInput) || undefined,
        preferredMessageChannel: channelInput,
        clinicalPriorityTier: govMode ? priorityInput : undefined,
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
      setCpfInput(patient.cpf ? formatCpfDisplay(patient.cpf) : "");
      setChannelInput(patient.preferredMessageChannel === "Audio" ? "Audio" : "Text");
      setPriorityInput(patient.clinicalPriorityTier ?? "Normal");
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
            {patient.preferredMessageChannel === "Audio" && (
              <Badge variant="secondary">Canal: áudio</Badge>
            )}
            {hasFeature(FEATURE_KEYS.aiCopilot) && (
              <PatientAiAvailabilityBadge
                settings={tenantSettings}
                isLoading={settingsLoading}
                isError={settingsError}
                platformConfiguredOverride={platformConfiguredOverride}
                isPlatformAdmin={isPlatform}
                canConfigureTenant={canWrite}
              />
            )}
            <span className="font-mono text-sm text-muted-foreground">{maskPhone(patient.phone)}</span>
            {patient.cpf && (
              <span className="font-mono text-sm text-muted-foreground">
                CPF {formatCpfDisplay(patient.cpf)}
              </span>
            )}
            {govMode && patient.clinicalPriorityTier && patient.clinicalPriorityTier !== "Normal" && (
              <Badge variant="secondary">
                {CLINICAL_PRIORITY_TIER_LABELS[patient.clinicalPriorityTier] ??
                  patient.clinicalPriorityTier}
              </Badge>
            )}
            {canWrite && (
              <Dialog open={phoneOpen} onOpenChange={setPhoneOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Pencil className="size-3" />
                    Editar dados
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dados do paciente</DialogTitle>
                    <DialogDescription>
                      Atualize WhatsApp, nome ou CPF. O telefone deve ser o mesmo usado no WhatsApp.
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
                    <div className="space-y-2">
                      <Label htmlFor="edit-cpf">CPF</Label>
                      <Input
                        id="edit-cpf"
                        value={cpfInput}
                        onChange={(e) => setCpfInput(e.target.value)}
                        placeholder="000.000.000-00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para remover o CPF cadastrado.
                      </p>
                    </div>
                    {canSetAudioChannel && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-channel">Canal de comunicação</Label>
                        <Select
                          value={channelInput}
                          onValueChange={(v) => setChannelInput(v as "Text" | "Audio")}
                        >
                          <SelectTrigger id="edit-channel">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Text">Texto</SelectItem>
                            <SelectItem value="Audio">Áudio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {govMode && (
                      <div className="space-y-2">
                        <Label>Prioridade clínica</Label>
                        <Select
                          value={priorityInput}
                          onValueChange={(v) => setPriorityInput(v as ClinicalPriorityTier)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CLINICAL_PRIORITY_TIER_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Influencia a ordem na fila de retirada quando prioridade inteligente está
                          ativa.
                        </p>
                      </div>
                    )}
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
          {hasFeature(FEATURE_KEYS.whatsappConversations) && (
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
          )}
          {canWrite && patient.status === "Onboarding" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerOnboardingResumeMutation.mutate()}
              disabled={triggerOnboardingResumeMutation.isPending}
            >
              <RefreshCw className="size-4" />
              {triggerOnboardingResumeMutation.isPending ? "Enviando…" : "Continuar cadastro"}
            </Button>
          )}
          {canWrite && hasFeature(FEATURE_KEYS.satisfactionCsat) && patient.status !== "Onboarding" && patient.status !== "OptedOut" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => triggerCsatMutation.mutate()}
              disabled={triggerCsatMutation.isPending}
            >
              <Star className="size-4" />
              {triggerCsatMutation.isPending ? "Enviando…" : "Pesquisa de satisfação"}
            </Button>
          )}
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
          {isAdmin && (
            <PatientDsarExportButton
              token={token!}
              patientId={id!}
              patientName={patient.name}
            />
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

      {achievements && achievements.items.some((a) => a.unlocked) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-amber-600" />
              Conquistas
            </CardTitle>
            <CardDescription>Marcos de adesão desbloqueados no WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {achievements.items
                .filter((a) => a.unlocked)
                .map((a) => (
                  <li
                    key={a.key}
                    className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">{a.displayName}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    {a.unlockedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(a.unlockedAt)}
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {token && id && hasFeature(FEATURE_KEYS.aiCopilot) && isAdmin && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Preview resumo (admin)</span>
          <PatientInsightPreviewModeToggle
            value={insightPreviewMode}
            onChange={setInsightPreviewMode}
          />
          <PatientInsightPromptDialog token={token} patientId={id} />
        </div>
      )}

      {token && id && hasFeature(FEATURE_KEYS.aiCopilot) && (
        <PatientAiInsightCard
          token={token}
          patientId={id}
          tenantSettings={tenantSettings}
          platformConfiguredOverride={platformConfiguredOverride}
          previewMode={insightPreviewMode}
        />
      )}

      {token && id && hasFeature(FEATURE_KEYS.aiCopilot) && (
        <PatientKokoroAssistantCard
          token={token}
          patientId={id}
          canWrite={canWrite}
          tenantSettings={tenantSettings}
          platformConfiguredOverride={platformConfiguredOverride}
          previewMode={insightPreviewMode}
          onTriggerTpb={() => triggerTpbMutation.mutate()}
        />
      )}

      {token && id && govMode && (
        <PatientCareDelegatesSection patientId={id} token={token} canWrite={canWrite} />
      )}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="careplan">Plano de cuidado</TabsTrigger>
          {hasFeature(FEATURE_KEYS.scalesMorisky) && (
            <TabsTrigger value="morisky">
              MMAS-8
              {(moriskyHistory?.assessments.length ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                  {moriskyHistory!.assessments.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {hasFeature(FEATURE_KEYS.scalesTpb) && (
            <TabsTrigger value="tpb">
              TCP
              {(tpbHistory?.assessments.length ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                  {tpbHistory!.assessments.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {behavioralEnabled && (
            <TabsTrigger value="behavioral">Perfil comportamental</TabsTrigger>
          )}
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
          {token && id && <PatientCarePlansTab patientId={id} token={token} canWrite={canWrite} />}
        </TabsContent>

        <TabsContent value="morisky">
          <PatientMoriskyTab
            assessments={moriskyHistory?.assessments}
            isLoading={moriskyLoading}
            canTrigger={canWrite}
            moriskyEnabled={tenantSettings?.moriskyEnabled}
            onTrigger={() => triggerMoriskyMutation.mutate()}
            isTriggering={triggerMoriskyMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="tpb">
          <PatientTpbTab
            assessments={tpbHistory?.assessments}
            risk={tpbRisk}
            isLoading={tpbLoading}
            riskLoading={tpbRiskLoading}
            canTrigger={canWrite}
            tpbEnabled={tenantSettings?.tpbEnabled}
            onTrigger={() => triggerTpbMutation.mutate()}
            isTriggering={triggerTpbMutation.isPending}
            onPreviewIntervention={canWrite ? () => previewTpbMutation.mutate() : undefined}
            isPreviewing={previewTpbMutation.isPending}
          />
        </TabsContent>

        {behavioralEnabled && token && id && (
          <TabsContent value="behavioral">
            <PatientBehavioralTab
              token={token}
              patientId={id}
              canWrite={canWrite}
              profile={behavioralProfile}
              profileLoading={behavioralProfileLoading}
              tpbRisk={tpbRisk}
              tpbRiskLoading={tpbRiskLoading}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
