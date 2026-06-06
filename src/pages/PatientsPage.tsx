import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
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
import { formatDateTime, maskPhone } from "@/lib/utils";

const STATUSES = ["", "Active", "Onboarding", "Paused", "Inactive", "OptedOut", "Reengagement"];

export function PatientsPage() {
  const { token, hasFeature, canWrite } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const { input: searchInput, setInput: setSearchInput, query: search } = useGridSearch();
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ phone: "", name: "", sendWelcome: true });

  useEffect(() => {
    setPage(1);
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

  const createMutation = useMutation({
    mutationFn: () =>
      api.createPatient(token!, {
        phone: form.phone,
        name: form.name.trim() || undefined,
        sendWelcome: form.sendWelcome,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setCreateOpen(false);
      setForm({ phone: "", name: "", sendWelcome: true });

      if (!result.created) {
        toast.info("Este telefone já está cadastrado.");
        navigate(`/pacientes/${result.id}`);
        return;
      }

      if (result.welcomeSent) {
        toast.success("Paciente cadastrado — boas-vindas enviadas no WhatsApp.");
      } else if (form.sendWelcome) {
        toast.success("Paciente cadastrado. Conecte um remetente WhatsApp ativo para enviar boas-vindas.");
      } else {
        toast.success("Paciente cadastrado.");
      }
      navigate(`/pacientes/${result.id}`);
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar"),
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

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
          <p className="text-muted-foreground">Gerencie e acompanhe pacientes do programa</p>
        </div>
        {canWrite && (
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
                  Informe o WhatsApp do paciente. Se já existir, abriremos a ficha existente.
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
                  <Label htmlFor="patient-name">Nome (opcional)</Label>
                  <Input
                    id="patient-name"
                    placeholder="Nome do paciente"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
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
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.phone.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Cadastrando…" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <CardTitle className="text-base">Como entram novos pacientes</CardTitle>
              <CardDescription className="mt-1">
                Duas formas equivalentes — o sistema verifica se o telefone já existe antes de criar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Pelo WhatsApp:</strong> o paciente envia qualquer mensagem para{" "}
            {activeSender ? (
              <span className="font-mono text-foreground">{maskPhone(activeSender.phoneNumber)}</span>
            ) : (
              <Link to="/whatsapp" className="text-primary underline">
                seu número conectado
              </Link>
            )}
            . Criamos o cadastro e iniciamos o onboarding automaticamente.
          </p>
          <p>
            <strong className="text-foreground">Pelo portal:</strong> use &quot;Novo paciente&quot; para pré-cadastrar
            e opcionalmente disparar as boas-vindas.
          </p>
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
            </div>
          </div>
          <GridSearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Buscar por nome ou telefone"
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Último check-in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 && (
                    <GridEmptyRow
                      colSpan={5}
                      message={
                        searchInput.trim()
                          ? "Nenhum paciente corresponde à busca."
                          : "Nenhum paciente ainda. Cadastre acima ou aguarde a primeira mensagem no WhatsApp."
                      }
                    />
                  )}
                  {data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link to={`/pacientes/${p.id}`} className="font-medium text-primary hover:underline">
                          {p.name ?? "Sem nome"}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{maskPhone(p.phone)}</TableCell>
                      <TableCell>
                        <PatientStatusBadge status={p.status} />
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
