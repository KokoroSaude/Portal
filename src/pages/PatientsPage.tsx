import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { PatientStatusBadge } from "@/components/PatientStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS, PATIENT_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, maskPhone } from "@/lib/utils";

const STATUSES = ["", "Active", "Onboarding", "Paused", "Inactive", "OptedOut", "Reengagement"];

export function PatientsPage() {
  const { token, hasFeature } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");

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
      <div>
        <h1 className="font-serif text-3xl">Pacientes</h1>
        <p className="text-muted-foreground">Gerencie e acompanhe pacientes do programa</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lista</CardTitle>
          <div className="flex flex-wrap gap-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput);
                setPage(1);
              }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="w-56 pl-8"
                  placeholder="Buscar nome ou telefone"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Buscar
              </Button>
            </form>
            <Select
              value={status || "all"}
              onValueChange={(v) => {
                setStatus(v === "all" ? "" : v);
                setPage(1);
              }}
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
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum paciente encontrado.
                      </TableCell>
                    </TableRow>
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
