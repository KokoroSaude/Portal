import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSendersTab } from "@/components/settings/SettingsSendersTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { FEATURE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const WEBHOOK_URL = `${API_BASE}/webhooks/meta`;
const VERIFY_TOKEN_HINT = import.meta.env.DEV
  ? "dev_verify_token (ambiente de desenvolvimento)"
  : "Configure o mesmo valor em Meta:VerifyToken no servidor da API Kokoro.";

type SetupStep = {
  id: string;
  title: string;
  description: string;
  done: boolean;
};

function copyToClipboard(value: string, label: string) {
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copiado`),
    () => toast.error(`Não foi possível copiar ${label.toLowerCase()}`),
  );
}

export function WhatsappPage() {
  const { token, hasFeature } = useAuth();
  const canManageSenders = hasFeature(FEATURE_KEYS.whatsappSendersManage);

  const { data: senders = [] } = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && canManageSenders,
  });

  const activeSender = senders.find((s) => s.isActive) ?? senders[0];

  const setupSteps = useMemo<SetupStep[]>(
    () => [
      {
        id: "waba",
        title: "WABA ID",
        description: activeSender?.wabaId
          ? `Configurado: ${activeSender.wabaId}`
          : "Informe o WhatsApp Business Account ID ao cadastrar o remetente.",
        done: Boolean(activeSender?.wabaId),
      },
      {
        id: "phone",
        title: "Phone ID",
        description: activeSender?.phoneId
          ? `Configurado: ${activeSender.phoneId}`
          : "Use o phone_number_id exibido no painel da Meta para o número escolhido.",
        done: Boolean(activeSender?.phoneId),
      },
      {
        id: "webhook",
        title: "Webhook Meta",
        description: "Aponte o callback URL e o verify token no app Meta Developers.",
        done: Boolean(activeSender?.wabaId && activeSender?.phoneId),
      },
    ],
    [activeSender],
  );

  const completedSteps = setupSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Gerencie os números remetentes do tenant (WABA ID, Phone ID e telefone E.164) conectados à Meta Business API."
      />

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Assistente de configuração</CardTitle>
              <CardDescription>
                Siga os passos abaixo para conectar o número e receber mensagens dos pacientes.
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {completedSteps}/{setupSteps.length} concluídos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ol className="space-y-3">
            {setupSteps.map((step, index) => (
              <li
                key={step.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-3 py-3",
                  step.done && "border-primary/20 bg-background",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {step.done ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                    <p className="font-medium">{step.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-xl border bg-background p-4">
              <p className="text-sm font-medium">Callback URL (webhook)</p>
              <p className="text-xs text-muted-foreground">
                Cole no Meta Developers → WhatsApp → Configuration → Webhook.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                  {WEBHOOK_URL}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(WEBHOOK_URL, "Webhook URL")}
                >
                  <Copy className="size-4" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border bg-background p-4">
              <p className="text-sm font-medium">Verify token</p>
              <p className="text-xs text-muted-foreground">
                Deve ser idêntico ao configurado no servidor Kokoro (Meta:VerifyToken).
              </p>
              <code className="block break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                {VERIFY_TOKEN_HINT}
              </code>
              <Button type="button" variant="link" className="h-auto px-0 text-xs" asChild>
                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks" target="_blank" rel="noreferrer">
                  Documentação Meta
                  <ExternalLink className="ml-1 size-3" />
                </a>
              </Button>
            </div>
          </div>

          {!canManageSenders && (
            <p className="text-sm text-muted-foreground">
              Faça upgrade do plano para cadastrar remetentes e concluir a integração.
            </p>
          )}
        </CardContent>
      </Card>

      <SettingsSendersTab />
    </div>
  );
}
