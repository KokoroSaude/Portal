import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { SettingsField, SettingsSwitchField } from "@/components/settings/SettingsField";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { ErpConnectionTestResult, TenantSettings } from "@/types/api";
import { formatDateTime } from "@/lib/utils";

const ERP_DOCS_URL = `${API_BASE}/docs/gov-erp`;

type ErpCredentialsCardProps = {
  form: TenantSettings;
  update: <K extends keyof TenantSettings>(key: K, value: TenantSettings[K]) => void;
  onTestResult: (result: ErpConnectionTestResult | null) => void;
  onApiKeyGenerated: (apiKey: string) => void;
};

export function ErpCredentialsCard({
  form,
  update,
  onTestResult,
  onApiKeyGenerated,
}: ErpCredentialsCardProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const credentialsQuery = useQuery({
    queryKey: ["erp-credentials"],
    queryFn: () => api.listErpCredentials(token!),
    enabled: !!token,
  });

  const generateMutation = useMutation({
    mutationFn: (sandbox: boolean) => api.generateErpCredential(token!, sandbox),
    onSuccess: (result) => {
      setGeneratedKey(result.apiKey);
      setKeyDialogOpen(true);
      onApiKeyGenerated(result.apiKey);
      queryClient.invalidateQueries({ queryKey: ["erp-credentials"] });
      toast.success(result.isSandbox ? "Chave de homologação gerada" : "Chave de produção gerada");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao gerar chave"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.revokeErpCredential(token!, id),
    onSuccess: () => {
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["erp-credentials"] });
      toast.success("Chave revogada");
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro ao revogar"),
  });

  const testMutation = useMutation({
    mutationFn: () => api.testErpConnection(token!),
    onSuccess: (result) => {
      onTestResult(result);
      if (result.success) {
        toast.success(result.message ?? "Conexão OK");
      } else {
        toast.error(result.message ?? "Teste de conexão falhou");
      }
      queryClient.invalidateQueries({ queryKey: ["integration-audit"] });
    },
    onError: (err) => {
      onTestResult(null);
      toast.error(err instanceof ApiClientError ? err.message : "Erro no teste");
    },
  });

  async function copyKey() {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      toast.success("Chave copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const credentials = credentialsQuery.data ?? [];
  const revokeTarget = selectedId ?? credentials[0]?.id ?? null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Integração ERP governamental</CardTitle>
              <CardDescription>
                Chaves para o sistema de estoque chamar a API de retirada Kokoro.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={ERP_DOCS_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 size-4" />
                Documentação
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate(false)}
            >
              <KeyRound className="mr-1.5 size-4" />
              Gerar chave produção
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate(true)}
            >
              <KeyRound className="mr-1.5 size-4" />
              Gerar chave homologação
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!revokeTarget || revokeMutation.isPending}
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget)}
            >
              <Trash2 className="mr-1.5 size-4" />
              Revogar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? "Testando…" : "Testar conexão"}
            </Button>
          </div>

          {credentialsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Prefixo</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead>Criada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.length === 0 ? (
                    <GridEmptyRow colSpan={5} message="Nenhuma chave ativa." />
                  ) : (
                    credentials.map((cred) => (
                      <TableRow
                        key={cred.id}
                        data-state={selectedId === cred.id ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(cred.id)}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            name="erp-credential"
                            checked={(selectedId ?? credentials[0]?.id) === cred.id}
                            onChange={() => setSelectedId(cred.id)}
                            aria-label={`Selecionar chave ${cred.keyPrefix}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{cred.keyPrefix}…</TableCell>
                        <TableCell>
                          <Badge variant={cred.isSandbox ? "secondary" : "default"}>
                            {cred.isSandbox ? "Homologação" : "Produção"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDateTime(cred.lastUsedAt)}
                        </TableCell>
                        <TableCell className="text-xs">{formatDateTime(cred.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <SettingsSwitchField
              id="pickupErpSandboxMode"
              label="Modo homologação (sandbox)"
              hint="Quando ativo, a API externa aceita apenas chaves marcadas como homologação e ignora efeitos de produção."
              checked={form.pickupErpSandboxMode ?? false}
              onCheckedChange={(checked) => update("pickupErpSandboxMode", checked)}
            />

            <SettingsField
              label="IPs permitidos"
              hint="Lista separada por vírgulas. Deixe vazio para aceitar qualquer IP. Ex.: 203.0.113.10, 198.51.100.0/24"
              className="sm:col-span-2"
            >
              <Input
                value={form.pickupErpAllowedIps ?? ""}
                onChange={(e) => update("pickupErpAllowedIps", e.target.value)}
                placeholder="203.0.113.10, 198.51.100.0/24"
              />
            </SettingsField>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={keyDialogOpen}
        onOpenChange={(open) => {
          setKeyDialogOpen(open);
          if (!open) setGeneratedKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave gerada</DialogTitle>
            <DialogDescription>
              Copie e guarde esta chave agora. Por segurança, ela não será exibida novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
            <code className="flex-1 break-all text-xs">{generatedKey}</code>
            <Button type="button" size="icon" variant="outline" onClick={() => void copyKey()}>
              <Copy className="size-4" />
              <span className="sr-only">Copiar chave</span>
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setKeyDialogOpen(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
