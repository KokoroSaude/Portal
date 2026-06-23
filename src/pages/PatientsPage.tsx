import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, ClipboardList, Download, MessageCircle, Plus, RefreshCw, Star, Upload } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useGridSearch } from "@/hooks/useGridSearch";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { formatDateTime, maskPhone } from "@/lib/utils";
import { maskCpf, stripCpf } from "@/lib/cpf";

const STATUSES = ["", "Active", "Onboarding", "Paused", "Inactive", "OptedOut", "Reengagement"];

export function PatientsPage() {
  const { token, hasFeature, canWrite } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoriskyOpen, setBulkMoriskyOpen] = useState(false);
  const [bulkTpbOpen, setBulkTpbOpen] = useState(false);
  const [bulkCsatOpen, setBulkCsatOpen] = useState(false);
  const [bulkOnboardingOpen, setBulkOnboardingOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const { input: searchInput, setInput: setSearchInput, query: search } = useGridSearch();
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSendWelcome, setImportSendWelcome] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    name: "",
    cpf: "",
    sendWelcome: true,
    preferredMessageChannel: "Text" as "Text" | "Audio",
    carePlanMedicationIds: [] as string[],
  });

  const { settings: tenantSettings, govMode } = useTenantSettings();

  const { data: medicationsCatalog } = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token && govMode,
  });

  const canSetAudioChannel =
    hasFeature(FEATURE_KEYS.whatsappVoice) && (tenantSettings?.voiceMessagesEnabled ?? false);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, status]);

  const { data, isLoading } = useQuery({
    queryKey: ["patients", page, search, status],
    queryFn: () =>
      api.getPatients(token!, {
        page,
        pageSize: 20,
        search: search || undefined,
        status: status || undefined,
      }),
    enabled: !!token,
  });

  const { data: senders = [] } = useQuery({
    queryKey: ["senders", "patients-page"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.whatsappSendersManage),
  });

  const activeSender = senders.find((s) => s.isActive) ?? senders[0];

  const bulkMoriskyMutation = useMutation({
    mutationFn: (patientIds: string[]) => api.triggerMoriskyBulk(token!, { patientIds }),
    onSuccess: (result) => {
      setBulkMoriskyOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `MMAS-8 enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar MMAS-8"),
  });

  const bulkTpbMutation = useMutation({
    mutationFn: (patientIds: string[]) => api.triggerTpbBulk(token!, { patientIds }),
    onSuccess: (result) => {
      setBulkTpbOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `TCP enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar TCP"),
  });

  const bulkCsatMutation = useMutation({
    mutationFn: (patientIds: string[]) => api.triggerCsatBulk(token!, { patientIds }),
    onSuccess: (result) => {
      setBulkCsatOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `Pesquisa de satisfação enviada para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar pesquisa de satisfação"),
  });

  const bulkOnboardingMutation = useMutation({
    mutationFn: (patientIds: string[]) => api.triggerOnboardingResumeBulk(token!, { patientIds }),
    onSuccess: (result) => {
      setBulkOnboardingOpen(false);
      setSelectedIds(new Set());
      toast.success(
        `Lembrete enviado para ${result.sent} de ${result.requested} paciente(s)` +
          (result.skipped > 0 ? ` (${result.skipped} ignorado(s))` : ""),
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar lembrete de cadastro"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPatient(token!, {
        phone: form.phone,
        name: form.name.trim() || undefined,
        cpf: stripCpf(form.cpf) || undefined,
        sendWelcome: form.sendWelcome,
        preferredMessageChannel: canSetAudioChannel ? form.preferredMessageChannel : undefined,
        carePlanMedicationIds:
          govMode && form.carePlanMedicationIds.length > 0
            ? form.carePlanMedicationIds
            : undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setCreateOpen(false);
      setForm({
        phone: "",
        name: "",
        cpf: "",
        sendWelcome: true,
        preferredMessageChannel: "Text",
        carePlanMedicationIds: [],
      });

      if (!result.created) {
        toast.info("Este telefone já está cadastrado.");
        navigate(`/pacientes/${result.id}`);
        return;
      }

      if (result.welcomeSent) {
        if (form.preferredMessageChannel === "Audio" && result.welcomeUsedMetaTemplate) {
          toast.success(
            "Paciente cadastrado — boas-vindas enviada como template do WhatsApp (obrigatório fora da janela de 24h). As próximas mensagens serão em áudio quando o paciente responder.",
          );
        } else {
          toast.success("Paciente cadastrado — boas-vindas enviadas no WhatsApp.");
        }
      } else if (form.sendWelcome) {
        toast.warning(
          "Paciente cadastrado, mas a boas-vindas não foi enviada. Verifique remetente WhatsApp ativo e template kokoro_boas_vindas aprovado no WABA da organização.",
        );
      } else {
        toast.success("Paciente cadastrado.");
      }
      navigate(`/pacientes/${result.id}`);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar"),
  });

  const importMutation = useMutation({
    mutationFn: () => api.importPatientsCsv(token!, importFile!, importSendWelcome),
    onSuccess: (result) => {
      setImportOpen(false);
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(
        `Importação: ${result.created} criado(s), ${result.skipped} ignorado(s), ${result.failed} falha(s)`,
      );
      if (result.errors.length > 0) {
        toast.warning(
          `${result.errors.length} erro(s). Ex.: linha ${result.errors[0]?.line} — ${result.errors[0]?.error}`,
          { duration: 8000 },
        );
      }
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro na importação CSV"),
  });

  const canSubmitCreate =
    form.phone.trim() &&
    (!govMode ||
      (form.name.trim() &&
        stripCpf(form.cpf).length === 11 &&
        form.carePlanMedicationIds.length > 0));

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const pageIds = data?.items.map((p) => p.id) ?? [];
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const bulkSelectEnabled = canWrite;
  const moriskyBulkEnabled = bulkSelectEnabled && hasFeature(FEATURE_KEYS.scalesMorisky) && tenantSettings?.moriskyEnabled;
  const tpbBulkEnabled = bulkSelectEnabled && hasFeature(FEATURE_KEYS.scalesTpb) && tenantSettings?.tpbEnabled;
  const csatBulkEnabled = bulkSelectEnabled && hasFeature(FEATURE_KEYS.satisfactionCsat);
  const onboardingBulkEnabled = bulkSelectEnabled;

  function togglePatient(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllOnPage(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleExport() {
    if (!token) return;
    setExporting(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const blob = await api.exportPatientsCsv(
        token,
        status || undefined,
        from.toISOString(),
        to.toISOString(),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pacientes.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Pacientes</h1>
          <p className="text-muted-foreground">
            {govMode
              ? "Pré-cadastro com CPF, nome e medicamentos do plano de cuidado"
              : "Gerencie e acompanhe pacientes do programa"}
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            {govMode && (
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="size-4" />
                    Importar CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar pacientes (CSV)</DialogTitle>
                    <DialogDescription>
                      Colunas esperadas: telefone, nome, cpf, medicamentos (separados por ponto e
                      vírgula).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="flex items-center justify-between rounded-lg border px-3 py-3">
                      <div>
                        <p className="text-sm font-medium">Enviar boas-vindas</p>
                        <p className="text-xs text-muted-foreground">
                          Dispara mensagem de ativação após importar.
                        </p>
                      </div>
                      <Switch
                        checked={importSendWelcome}
                        onCheckedChange={setImportSendWelcome}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={!importFile || importMutation.isPending}
                    >
                      {importMutation.isPending ? "Importando…" : "Importar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Novo paciente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar paciente</DialogTitle>
                <DialogDescription>
                  {govMode
                    ? "Informe WhatsApp, CPF, nome completo e ao menos um medicamento do plano de cuidado."
                    : "Informe o WhatsApp do paciente. Se já existir, abriremos a ficha existente."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient-phone">WhatsApp (E.164)</Label>
                  <Input
                    id="patient-phone"
                    placeholder="+5511999999999"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-name">
                    Nome{govMode ? "" : " (opcional)"}
                  </Label>
                  <Input
                    id="patient-name"
                    placeholder="Nome do paciente"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient-cpf">
                    CPF{govMode ? "" : " (opcional)"}
                  </Label>
                  <Input
                    id="patient-cpf"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ajuda a identificar o paciente além do WhatsApp. Único por farmácia.
                  </p>
                </div>
                {govMode && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Label>Medicamentos do plano de cuidado</Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione os medicamentos SUS que o paciente utiliza.
                    </p>
                    <div className="max-h-40 space-y-2 overflow-y-auto pt-1">
                      {(medicationsCatalog ?? []).map((med) => (
                        <label key={med.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={form.carePlanMedicationIds.includes(med.id)}
                            onCheckedChange={(checked) =>
                              setForm((f) => ({
                                ...f,
                                carePlanMedicationIds: checked
                                  ? [...f.carePlanMedicationIds, med.id]
                                  : f.carePlanMedicationIds.filter((id) => id !== med.id),
                              }))
                            }
                          />
                          {med.canonicalName}
                        </label>
                      ))}
                      {(medicationsCatalog ?? []).length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Cadastre medicamentos em Configurações → Catálogo.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">Enviar boas-vindas</p>
                    <p className="text-xs text-muted-foreground">
                      Inicia o onboarding pelo WhatsApp (requer remetente ativo).
                    </p>
                  </div>
                  <Switch
                    checked={form.sendWelcome}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, sendWelcome: v }))}
                  />
                </div>
                {canSetAudioChannel && (
                  <div className="space-y-2">
                    <Label htmlFor="patient-channel">Canal de comunicação</Label>
                    <Select
                      value={form.preferredMessageChannel}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          preferredMessageChannel: v as "Text" | "Audio",
                        }))
                      }
                    >
                      <SelectTrigger id="patient-channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Text">Texto</SelectItem>
                        <SelectItem value="Audio">Áudio</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pacientes em áudio recebem respostas faladas no WhatsApp.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!canSubmitCreate || createMutation.isPending}
                >
                  {createMutation.isPending ? "Cadastrando…" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <CardTitle className="text-base">Como entram novos pacientes</CardTitle>
              <CardDescription className="mt-1">
                {govMode
                  ? "Pacientes devem ser pré-cadastrados com CPF, nome e medicamentos antes do WhatsApp."
                  : tenantSettings?.requirePreRegisteredPatients
                    ? "Cadastre primeiro no portal — o WhatsApp só atende números já incluídos."
                    : "Duas formas equivalentes — o sistema verifica se o telefone já existe antes de criar."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {govMode ? (
            <>
              <p>
                <strong className="text-foreground">Pré-cadastro:</strong> use &quot;Novo paciente&quot; ou
                importação CSV com CPF, nome e medicamentos. O paciente recebe consentimento de retirada
                e adesão pelo WhatsApp.
              </p>
              <p>
                <strong className="text-foreground">Plano de cuidado:</strong> medicamentos selecionados no
                cadastro geram lembretes de adesão e entram na fila quando houver estoque.
              </p>
            </>
          ) : tenantSettings?.requirePreRegisteredPatients ? (
            <>
              <p>
                <strong className="text-foreground">Pelo portal:</strong> use &quot;Novo paciente&quot; para
                cadastrar o número e, se quiser, disparar as boas-vindas antes do paciente escrever no
                WhatsApp.
              </p>
              <p>
                <strong className="text-foreground">Pelo WhatsApp:</strong> só funciona depois do cadastro. Se
                alguém não cadastrado enviar mensagem para{" "}
                {activeSender ? (
                  <span className="font-mono text-foreground">{maskPhone(activeSender.phoneNumber)}</span>
                ) : (
                  <Link to="/whatsapp/configuracao" className="text-primary underline">
                    seu número conectado
                  </Link>
                )}
                , recebe um aviso de que precisa ser incluído pela equipe antes de continuar.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-foreground">Pelo WhatsApp:</strong> o paciente envia qualquer mensagem para{" "}
                {activeSender ? (
                  <span className="font-mono text-foreground">{maskPhone(activeSender.phoneNumber)}</span>
                ) : (
                  <Link to="/whatsapp/configuracao" className="text-primary underline">
                    seu número conectado
                  </Link>
                )}
                . Criamos o cadastro e iniciamos o onboarding automaticamente.
              </p>
              <p>
                <strong className="text-foreground">Pelo portal:</strong> use &quot;Novo paciente&quot; para
                pré-cadastrar e opcionalmente disparar as boas-vindas.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select
                value={status || "all"}
                onValueChange={(v) => setStatus(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUSES.filter(Boolean).map((s) => (
                    <SelectItem key={s} value={s}>
                      {PATIENT_STATUS_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFeature(FEATURE_KEYS.reportsBasic) && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  <Download className="size-4" />
                  {exporting ? "Exportando…" : "Exportar CSV"}
                </Button>
              )}
              {onboardingBulkEnabled && selectedIds.size > 0 && (
                <Dialog open={bulkOnboardingOpen} onOpenChange={setBulkOnboardingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="size-4" />
                      Continuar cadastro ({selectedIds.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lembrar pacientes selecionados?</DialogTitle>
                      <DialogDescription>
                        {selectedIds.size} paciente(s) receberão no WhatsApp a pergunta em que o
                        cadastro parou. Só quem ainda estiver com cadastro em andamento será
                        incluído.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkOnboardingOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkOnboardingMutation.mutate([...selectedIds])}
                        disabled={bulkOnboardingMutation.isPending}
                      >
                        {bulkOnboardingMutation.isPending ? "Enviando…" : "Confirmar envio"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {csatBulkEnabled && selectedIds.size > 0 && (
                <Dialog open={bulkCsatOpen} onOpenChange={setBulkCsatOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Star className="size-4" />
                      Satisfação ({selectedIds.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar pesquisa de satisfação?</DialogTitle>
                      <DialogDescription>
                        {selectedIds.size} paciente(s) receberão a pergunta de 1 a 5 no WhatsApp.
                        Quem já tiver pesquisa pendente ou estiver em outro fluxo será ignorado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkCsatOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkCsatMutation.mutate([...selectedIds])}
                        disabled={bulkCsatMutation.isPending}
                      >
                        {bulkCsatMutation.isPending ? "Enviando…" : "Confirmar envio"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {moriskyBulkEnabled && selectedIds.size > 0 && (
                <Dialog open={bulkMoriskyOpen} onOpenChange={setBulkMoriskyOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <ClipboardList className="size-4" />
                      MMAS-8 ({selectedIds.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar MMAS-8 para selecionados?</DialogTitle>
                      <DialogDescription>
                        {selectedIds.size} paciente(s) receberão a pesquisa no WhatsApp. Quem não
                        puder receber (check-in pendente, opt-out, etc.) será ignorado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkMoriskyOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkMoriskyMutation.mutate([...selectedIds])}
                        disabled={bulkMoriskyMutation.isPending}
                      >
                        {bulkMoriskyMutation.isPending ? "Enviando…" : "Confirmar envio"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {tpbBulkEnabled && selectedIds.size > 0 && (
                <Dialog open={bulkTpbOpen} onOpenChange={setBulkTpbOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Brain className="size-4" />
                      TCP ({selectedIds.size})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar TCP para selecionados?</DialogTitle>
                      <DialogDescription>
                        {selectedIds.size} paciente(s) receberão a escala de comportamento no
                        WhatsApp. Quem não puder receber será ignorado.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkTpbOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => bulkTpbMutation.mutate([...selectedIds])}
                        disabled={bulkTpbMutation.isPending}
                      >
                        {bulkTpbMutation.isPending ? "Enviando…" : "Confirmar envio"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          <GridSearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Buscar por nome, telefone ou CPF"
            resultCount={data?.items.length}
            totalCount={data?.total}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {bulkSelectEnabled && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={(v) => toggleAllOnPage(v === true)}
                          aria-label="Selecionar página"
                        />
                      </TableHead>
                    )}
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Último check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <GridEmptyRow
                      colSpan={bulkSelectEnabled ? 7 : 6}
                      message={
                        searchInput.trim()
                          ? "Nenhum paciente corresponde à busca."
                          : "Nenhum paciente ainda. Cadastre acima ou aguarde a primeira mensagem no WhatsApp."
                      }
                    />
                  )}
                  {data?.items.map((p) => (
                    <TableRow key={p.id}>
                      {bulkSelectEnabled && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={(v) => togglePatient(p.id, v === true)}
                            aria-label={`Selecionar ${p.name ?? "paciente"}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Link to={`/pacientes/${p.id}`} className="font-medium text-primary hover:underline">
                          {p.name ?? "Sem nome"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{maskPhone(p.phone)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {p.cpf ? maskCpf(p.cpf) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <PatientStatusBadge status={p.status} />
                          {(p.consecutiveMissedCheckins ?? 0) >= 3 && (
                            <Badge variant="warning">Risco adesão</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{p.medication ?? "—"}</TableCell>
                      <TableCell>{formatDateTime(p.lastCheckinAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {data?.total ?? 0} paciente(s) · página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
