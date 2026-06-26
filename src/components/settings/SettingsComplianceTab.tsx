import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceDocumentDialog } from "@/components/compliance/ComplianceDocumentDialog";
import { PatientAiAvailabilityBadge } from "@/components/patients/PatientAiAvailabilityBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiClientError } from "@/lib/api";
import { downloadJsonFile } from "@/lib/compliance";
import type { TenantSettings } from "@/types/api";

const CONTACTS = [
  { label: "DPO Kokoro", value: "dpo@kokoro.health" },
  { label: "Segurança Kokoro", value: "security@kokoro.health" },
  { label: "Privacidade Unimed CNU", value: "gestaodeprivacidade@unimedcnu.coop.br" },
] as const;

type Props = {
  token: string;
  settings: TenantSettings;
};

export function SettingsComplianceTab({ token, settings }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["compliance-documents"],
    queryFn: () => api.getComplianceDocuments(token),
  });

  const auditExport = useMutation({
    mutationFn: async () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return api.getComplianceAuditLog(token, {
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 10_000,
      });
    },
    onSuccess: (result) => {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJsonFile(result, `auditoria-${stamp}.json`);
      toast.success(`Exportados ${result.items.length} registro(s) de auditoria.`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao exportar auditoria"),
  });

  const twoFactorLabel = settings.adminTwoFactorRequired
    ? "Obrigatório para administradores"
    : "Opcional";

  const retentionLabel =
    settings.dataRetentionDays && settings.dataRetentionDays > 0
      ? `${settings.dataRetentionDays} dias`
      : "Padrão da plataforma";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Status de conformidade
          </CardTitle>
          <CardDescription>
            Indicadores operacionais do piloto — privacidade, segurança e IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-primary" />
              Inteligência artificial
            </div>
            <PatientAiAvailabilityBadge settings={settings} canConfigureTenant />
            {settings.aiEnabled && !settings.aiApprovedByController && (
              <p className="mt-2 text-sm text-amber-900">
                Aguardando aprovação formal do controlador (ex.: Unimed).
              </p>
            )}
            {settings.aiApprovedByController && settings.aiApprovalReference && (
              <p className="mt-2 text-sm text-muted-foreground">
                Referência: <code>{settings.aiApprovalReference}</code>
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-primary" />
              Autenticação de administradores
            </div>
            <Badge variant={settings.adminTwoFactorRequired ? "success" : "outline"}>
              2FA {twoFactorLabel.toLowerCase()}
            </Badge>
          </div>

          <div className="rounded-lg border p-4 sm:col-span-2">
            <p className="text-sm font-medium">Retenção de dados</p>
            <p className="mt-1 text-sm text-muted-foreground">{retentionLabel}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            Documentos
          </CardTitle>
          <CardDescription>
            Políticas, registros e arquitetura aplicáveis à operação com dados de beneficiários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {docsLoading && <p className="text-sm text-muted-foreground">Carregando documentos…</p>}
          {documents?.map((doc) => (
            <div
              key={doc.slug}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{doc.title}</p>
                  <Badge variant="outline">{doc.category}</Badge>
                </div>
                {doc.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
                )}
              </div>
              <Button type="button" variant="outline" onClick={() => setOpenSlug(doc.slug)}>
                Ler documento
              </Button>
            </div>
          ))}
          {!docsLoading && documents?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum documento disponível.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            Contatos
          </CardTitle>
          <CardDescription>Canais para privacidade, segurança e titulares.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONTACTS.map((contact) => (
            <div key={contact.value} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">{contact.label}</span>
              <a
                href={`mailto:${contact.value}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {contact.value}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-5 text-primary" />
            Exportações
          </CardTitle>
          <CardDescription>
            Ferramentas para auditoria e atendimento a titulares (DSAR).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Trilha de auditoria</p>
              <p className="text-sm text-muted-foreground">
                Últimos 90 dias em JSON — ações de operadores no portal e integrações.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={auditExport.isPending}
              onClick={() => auditExport.mutate()}
            >
              {auditExport.isPending ? "Exportando…" : "Exportar JSON"}
            </Button>
          </div>
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Para exportar dados de um titular (DSAR), abra o perfil do paciente e use o botão{" "}
            <strong>Exportar dados (DSAR)</strong> — disponível para administradores.
          </div>
        </CardContent>
      </Card>

      <ComplianceDocumentDialog token={token} slug={openSlug} onClose={() => setOpenSlug(null)} />
    </div>
  );
}
