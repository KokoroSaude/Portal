import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  ClipboardList,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { toastPatientStatusUpdated } from "@/lib/patientStatusNotifications";
import { PatientTimelineCard } from "@/components/patients/PatientTimelineCard";
import { PatientSchedulingPanel } from "@/components/patients/PatientSchedulingPanel";
import {
  PatientWhatsAppWindowBanner,
} from "@/components/patients/PatientWhatsAppWindowBanner";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { Badge } from "@/components/ui/badge";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import { PatientCarePlansTab } from "@/components/patients/PatientCarePlansTab";
import { PatientFeatureLinkCard } from "@/components/patients/PatientFeatureLinkCard";
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
import type { ClinicalPriorityTier } from "@/types/api";

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, canWrite, hasFeature, isPlatform } = useAuth();
  const queryClient = useQueryClient();
  const [pauseReason, setPauseReason] = useState("");
  const [milestoneDays, setMilestoneDays] = useState<7 | 14 | 30>(7);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cpfInput, setCpfInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<ClinicalPriorityTier>("Normal");
  const [channelInput, setChannelInput] = useState<"Text" | "Audio">("Text");
  const [reactivateOpen, setReactivateOpen] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.getPatient(token!, id!),
    enabled: !!token && !!id,
  });

  const voiceFeatureEnabled = hasFeature(FEATURE_KEYS.whatsappVoice);

  const { data: scheduling, isLoading: schedulingLoading } = useQuery({
    queryKey: ["patient-scheduling", id],
    queryFn: () => api.getPatientScheduling(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: moriskyHistory } = useQuery({
    queryKey: ["patient-morisky", id],
    queryFn: () => api.getPatientMorisky(token!, id!),
    enabled: !!token && !!id && hasFeature(FEATURE_KEYS.scalesMorisky),
  });

  const { data: achievements } = useQuery({
    queryKey: ["patient-achievements", id],
    queryFn: () => api.getPatientAchievements(token!, id!),
    enabled: !!token && !!id,
  });

  const { data: tpbHistory } = useQuery({
    queryKey: ["patient-tpb", id],
    queryFn: () => api.getPatientTpb(token!, id!),
    enabled: !!token && !!id && hasFeature(FEATURE_KEYS.scalesTpb),
  });

  const behavioralEnabled = hasFeature(FEATURE_KEYS.behavioralProfile);
  const aiEnabled = hasFeature(FEATURE_KEYS.aiCopilot);
  const moriskyFeatureEnabled = hasFeature(FEATURE_KEYS.scalesMorisky);
  const tpbFeatureEnabled = hasFeature(FEATURE_KEYS.scalesTpb);

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
    enabled: !!token && isPlatform && aiEnabled,
  });

  const platformConfiguredOverride = platformAi?.isConfigured;

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

  const triggerReminderMutation = useMutation({
    mutationFn: () => api.triggerPatientReminder(token!, id!),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
      void queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
      void queryClient.invalidateQueries({ queryKey: ["patient-timeline", id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar lembrete de teste"),
  });

  const triggerMilestoneMutation = useMutation({
    mutationFn: () => api.triggerPatientMilestone(token!, id!, milestoneDays),
    onSuccess: (result) => {
      if (result.sent) toast.success(result.message);
      else toast.warning(result.message);
      void queryClient.invalidateQueries({ queryKey: ["patient-timeline", id] });
      void queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao disparar marco"),
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.pausePatient(token!, id!, pauseReason || undefined),
    onSuccess: (result) => {
      toastPatientStatusUpdated("Paciente pausado", result);
      setPauseOpen(false);
      setPauseReason("");
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao pausar");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.resumePatient(token!, id!),
    onSuccess: (result) => {
      const successMessage =
        patient?.status === "OptedOut"
          ? "Paciente reativado — lembretes e mensagens voltam a ser enviados"
          : "Paciente reativado";
      toastPatientStatusUpdated(successMessage, result);
      setReactivateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["patient", id] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", id] });
      queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao reativar");
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
      queryClient.invalidateQueries({ queryKey: ["patient-scheduling", id] });
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
  const canReactivateFromOptOut = patient.status === "OptedOut";
  const remindersEnabled = hasFeature(FEATURE_KEYS.engagementReminders);
  const milestonesEnabled = hasFeature(FEATURE_KEYS.engagementMilestones);
  const showEngagementTriggers =
    canWrite && patient.status === "Active" && (remindersEnabled || milestonesEnabled);

  const showMoreSection =
    id &&
    (aiEnabled ||
      behavioralEnabled ||
      moriskyFeatureEnabled ||
      tpbFeatureEnabled ||
      govMode);

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
            {aiEnabled && (
              <PatientAiAvailabilityBadge
                settings={tenantSettings}
                isLoading={settingsLoading}
                isError={settingsError}
                platformConfiguredOverride={platformConfiguredOverride}
                isPlatformAdmin={isPlatform}
                canConfigureTenant={canWrite}
              />
            )}
            <span className="font-mono text-sm text-muted-foreground">{maskPhone(patient.phone, patient.phoneLast4)}</span>
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
            <div className="flex flex-col items-end gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => triggerCsatMutation.mutate()}
                disabled={triggerCsatMutation.isPending}
              >
                <Star className="size-4" />
                {triggerCsatMutation.isPending ? "Enviando…" : "Pesquisa de satisfação"}
              </Button>
              {scheduling?.conversationStep === "WaitingCheckin" && (
                <p className="max-w-xs text-right text-xs text-muted-foreground">
                  Interrompe o check-in pendente e envia a pesquisa agora.
                </p>
              )}
            </div>
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
          {canWrite && canReactivateFromOptOut && (
            <Dialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Play className="size-4" />
                  Reativar paciente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reativar paciente em opt-out</DialogTitle>
                  <DialogDescription>
                    Este paciente pediu para sair das mensagens automáticas. Ao reativar, lembretes,
                    check-ins e outras comunicações voltam a ser enviados pelo WhatsApp.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReactivateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => resumeMutation.mutate()}
                    disabled={resumeMutation.isPending}
                  >
                    {resumeMutation.isPending ? "Reativando…" : "Confirmar reativação"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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

      {!schedulingLoading && scheduling?.whatsAppWindow && (
        <PatientWhatsAppWindowBanner
          whatsAppWindow={scheduling.whatsAppWindow}
          tenantSendWindow={scheduling.tenantSendWindow}
        />
      )}

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

      <PatientSchedulingPanel
        scheduling={scheduling}
        isLoading={schedulingLoading}
        patientId={patient.id}
        patientStatus={patient.status}
        canWrite={canWrite}
        showEngagementTriggers={showEngagementTriggers}
        milestoneDays={milestoneDays}
        onMilestoneDaysChange={setMilestoneDays}
        onTriggerTestReminder={
          remindersEnabled ? () => triggerReminderMutation.mutate() : undefined
        }
        onTriggerMilestone={
          milestonesEnabled ? () => triggerMilestoneMutation.mutate() : undefined
        }
        isTriggeringReminder={triggerReminderMutation.isPending}
        isTriggeringMilestone={triggerMilestoneMutation.isPending}
        onPause={canPause ? () => setPauseOpen(true) : undefined}
        onResume={
          canResume || canReactivateFromOptOut ? () => resumeMutation.mutate() : undefined
        }
        isPausing={pauseMutation.isPending}
        isResuming={resumeMutation.isPending}
      />

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

      {showMoreSection && (
        <div className="space-y-3">
          <div>
            <h2 className="font-serif text-xl">Mais sobre este paciente</h2>
            <p className="text-sm text-muted-foreground">
              Avaliações, IA e rede de cuidado em páginas dedicadas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aiEnabled && (
              <PatientFeatureLinkCard
                icon={Sparkles}
                title="Assistente IA"
                description="Resumo clínico, sugestões de acompanhamento e insights personalizados."
                to={`/pacientes/${id}/assistente-ia`}
                actionLabel="Abrir assistente IA"
              />
            )}
            {behavioralEnabled && (
              <PatientFeatureLinkCard
                icon={Brain}
                title="Perfil comportamental"
                description="Avaliação estratégica, barreiras de adesão e questionário no portal."
                to={`/pacientes/${id}/avaliacao-estrategica`}
                actionLabel="Abrir avaliação estratégica"
              />
            )}
            {moriskyFeatureEnabled && (
              <PatientFeatureLinkCard
                icon={ClipboardList}
                title="MMAS-8"
                description="Histórico de adesão medicamentosa e disparo manual da escala."
                to={`/pacientes/${id}/mmas-8`}
                actionLabel="Abrir MMAS-8"
                badge={
                  (moriskyHistory?.assessments.length ?? 0) > 0
                    ? moriskyHistory!.assessments.length
                    : undefined
                }
              />
            )}
            {tpbFeatureEnabled && (
              <PatientFeatureLinkCard
                icon={ClipboardList}
                title="TCP"
                description="Teoria do Comportamento Planejado, risco e intervenções."
                to={`/pacientes/${id}/tcp`}
                actionLabel="Abrir TCP"
                badge={
                  (tpbHistory?.assessments.length ?? 0) > 0
                    ? tpbHistory!.assessments.length
                    : undefined
                }
              />
            )}
            {govMode && (
              <PatientFeatureLinkCard
                icon={Users}
                title="Rede de cuidado"
                description="Delegados autorizados a retirar medicamentos e receber notificações."
                to={`/pacientes/${id}/rede-cuidado`}
                actionLabel="Abrir rede de cuidado"
              />
            )}
          </div>
        </div>
      )}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="careplan">Plano de cuidado</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          {token && id && <PatientTimelineCard token={token} patientId={id} />}
        </TabsContent>

        <TabsContent value="careplan">
          {token && id && <PatientCarePlansTab patientId={id} token={token} canWrite={canWrite} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
