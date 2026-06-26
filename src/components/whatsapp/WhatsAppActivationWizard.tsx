import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Phone,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import {
  FEATURE_KEYS,
  WHATSAPP_ACTIVATION_STATUS,
  WHATSAPP_ACTIVATION_STATUS_LABELS,
  WHATSAPP_MODE_LABELS,
} from "@/lib/constants";
import { formatDateTime, maskPhone } from "@/lib/utils";
import type { WhatsappSender, WhatsAppActivationStatusDto, WhatsAppSenderPurpose } from "@/types/api";
import { WhatsappBusinessProfileEditor } from "@/components/whatsapp/WhatsappBusinessProfileEditor";
import {
  WhatsAppSenderPurposeSelect,
  WhatsAppSenderPurposeBadge,
} from "@/components/whatsapp/WhatsAppSenderPurposeSelect";

type WizardStep = "overview" | "phone" | "otp" | "profile" | "done";

const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "phone", label: "Telefone" },
  { id: "otp", label: "Código OTP" },
  { id: "profile", label: "Perfil" },
  { id: "done", label: "Concluído" },
];

const PROVISIONING_POLL_LIMIT = 60;

type WhatsAppActivationWizardProps = {
  /** When true, opens directly on the phone step (e.g. "Adicionar outro número"). */
  startOnPhone?: boolean;
  onStartOnPhoneConsumed?: () => void;
};

function normalizeBrazilPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function isProvisioningStatus(status: WhatsAppActivationStatusDto["status"]): boolean {
  return (
    status === WHATSAPP_ACTIVATION_STATUS.Provisioning ||
    status === WHATSAPP_ACTIVATION_STATUS.WaitingTemplates
  );
}

function isConnectedStatus(status: WhatsAppActivationStatusDto["status"]): boolean {
  return (
    status === WHATSAPP_ACTIVATION_STATUS.Ready ||
    status === WHATSAPP_ACTIVATION_STATUS.TrialActive
  );
}

function stepIndex(step: WizardStep): number {
  return WIZARD_STEPS.findIndex((s) => s.id === step);
}

function WizardStepper({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = stepIndex(currentStep);

  return (
    <ol className="flex flex-wrap gap-2 border-b pb-4">
      {WIZARD_STEPS.map((item, index) => {
        const done = index < currentIndex;
        const active = item.id === currentStep;
        return (
          <li
            key={item.id}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              active
                ? "bg-primary text-primary-foreground"
                : done
                  ? "bg-muted text-foreground"
                  : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[10px] ${
                active
                  ? "bg-primary-foreground/20"
                  : done
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-background"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}

export function WhatsAppActivationWizard({
  startOnPhone = false,
  onStartOnPhoneConsumed,
}: WhatsAppActivationWizardProps) {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasFeature(FEATURE_KEYS.whatsappSendersManage);

  const [step, setStep] = useState<WizardStep>("overview");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState<WhatsAppSenderPurpose>(1);
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifiedSenderId, setVerifiedSenderId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [provisioningTimedOut, setProvisioningTimedOut] = useState(false);
  const provisioningPolls = useRef(0);

  const statusQuery = useQuery({
    queryKey: ["whatsapp-activation-status"],
    queryFn: () => api.getWhatsAppActivationStatus(token!),
    enabled: !!token && canManage,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status !== undefined && isProvisioningStatus(status) ? 3000 : false;
    },
  });

  const sendersQuery = useQuery({
    queryKey: ["senders"],
    queryFn: () => api.listSenders(token!),
    enabled: !!token && canManage,
  });

  const status = statusQuery.data;

  useEffect(() => {
    if (!startOnPhone) return;
    setStep("phone");
    onStartOnPhoneConsumed?.();
  }, [startOnPhone, onStartOnPhoneConsumed]);

  useEffect(() => {
    if (!status || step !== "overview") return;
    if (status.status === WHATSAPP_ACTIVATION_STATUS.AwaitingOtp && status.activeSessionId) {
      setSessionId(status.activeSessionId);
      if (status.activeSessionPhone) {
        setPhone(status.activeSessionPhone);
      }
      setStep("otp");
    }
    if (isProvisioningStatus(status.status)) {
      setStep("done");
    }
  }, [status, step]);

  useEffect(() => {
    if (!status || !isProvisioningStatus(status.status)) {
      provisioningPolls.current = 0;
      setProvisioningTimedOut(false);
      return;
    }

    provisioningPolls.current += 1;
    if (provisioningPolls.current >= PROVISIONING_POLL_LIMIT) {
      setProvisioningTimedOut(true);
    }
  }, [status?.status, statusQuery.dataUpdatedAt]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-activation-status"] });
    queryClient.invalidateQueries({ queryKey: ["senders"] });
    queryClient.invalidateQueries({ queryKey: ["whatsapp-diagnostics"] });
  };

  const startMutation = useMutation({
    mutationFn: () =>
      api.startWhatsAppActivation(token!, {
        phone: normalizeBrazilPhone(phone),
        purpose,
      }),
    onSuccess: (result) => {
      setSessionId(result.sessionId);
      setOtp("");
      setStep("otp");
      invalidateAll();
      toast.success(`Código enviado por ${result.codeMethod.toLowerCase()}.`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao iniciar ativação"),
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      api.verifyWhatsAppActivation(token!, { sessionId: sessionId!, otp: otp.trim() }),
    onSuccess: (result) => {
      setVerifiedSenderId(result.senderId);
      invalidateAll();
      if (result.templatesReady && result.status === WHATSAPP_ACTIVATION_STATUS.Ready) {
        toast.success("Número conectado e pronto para uso.");
        setStep("profile");
        setProfileOpen(true);
      } else {
        toast.success("Número registrado — finalizando configuração…");
        setStep("done");
      }
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Código inválido ou expirado"),
  });

  const resendMutation = useMutation({
    mutationFn: (useVoice: boolean) =>
      api.resendWhatsAppActivation(token!, { sessionId: sessionId!, useVoice }),
    onSuccess: (result) => {
      toast.success(`Novo código enviado por ${result.codeMethod.toLowerCase()}.`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao reenviar código"),
  });

  const trialMutation = useMutation({
    mutationFn: () => api.startWhatsAppTrial(token!),
    onSuccess: (result) => {
      invalidateAll();
      toast.success(`Trial ativo até ${formatDateTime(result.trialExpiresAt)}.`);
      setStep("overview");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao iniciar trial"),
  });

  const profileSender: WhatsappSender | null = useMemo(() => {
    if (!verifiedSenderId) return null;
    return sendersQuery.data?.find((s) => s.id === verifiedSenderId) ?? null;
  }, [verifiedSenderId, sendersQuery.data]);

  const otpDisplayPhone = useMemo(() => {
    const normalized = phone ? normalizeBrazilPhone(phone) : "";
    if (normalized) return maskPhone(normalized);
    if (status?.activeSessionPhone) return maskPhone(status.activeSessionPhone);
    return "seu número";
  }, [phone, status?.activeSessionPhone]);

  if (!canManage) return null;

  if (statusQuery.isError) {
    return (
      <QueryErrorState
        message="Não foi possível carregar o status de ativação do WhatsApp."
        error={statusQuery.error}
        onRetry={() => void statusQuery.refetch()}
      />
    );
  }

  const statusLabel = status
    ? WHATSAPP_ACTIVATION_STATUS_LABELS[status.status] ?? "Desconhecido"
    : "Carregando…";

  const modeLabel = status ? WHATSAPP_MODE_LABELS[status.whatsAppMode] : null;

  return (
    <div className="space-y-4">
      <WizardStepper currentStep={step} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isConnectedStatus(status?.status ?? 0) ? "default" : "secondary"}>
          {statusLabel}
        </Badge>
        {modeLabel && <Badge variant="outline">{modeLabel}</Badge>}
        {status?.trialExpiresAt && status.whatsAppMode === 0 && (
          <span className="text-xs text-muted-foreground">
            Expira em {formatDateTime(status.trialExpiresAt)}
          </span>
        )}
      </div>

      {status?.message && (
        <p className="text-sm text-muted-foreground">{status.message}</p>
      )}

      {step === "overview" && (
        <div className="space-y-4">
          {sendersQuery.data && sendersQuery.data.length > 0 && (
            <ul className="space-y-2 text-sm">
              {sendersQuery.data.map((sender) => (
                <li
                  key={sender.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{sender.displayName}</p>
                    <p className="text-muted-foreground">{maskPhone(sender.phoneNumber)}</p>
                  </div>
                  <div className="text-right">
                    <WhatsAppSenderPurposeBadge purpose={sender.purpose} showDescription />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {sendersQuery.data && sendersQuery.data.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Para alterar a finalidade de um número já cadastrado, use a tabela{" "}
              <strong>Números cadastrados</strong> abaixo e clique em <strong>Editar</strong>.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setStep("phone")}>
              <Phone className="mr-2 size-4" />
              {sendersQuery.data?.length ? "Adicionar outro número" : "Cadastrar meu número"}
            </Button>

            {status?.status === WHATSAPP_ACTIVATION_STATUS.NoSender && (
              <Button
                variant="outline"
                onClick={() => trialMutation.mutate()}
                disabled={trialMutation.isPending}
              >
                {trialMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Testar com número Kokoro (14 dias)
              </Button>
            )}

            {status && isProvisioningStatus(status.status) && (
              <Button variant="ghost" size="sm" onClick={() => statusQuery.refetch()}>
                <RefreshCw className="mr-2 size-4" />
                Atualizar status
              </Button>
            )}
          </div>

          {status?.status === WHATSAPP_ACTIVATION_STATUS.TrialExpired && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              O período de trial terminou. Cadastre o número da farmácia para continuar enviando
              mensagens em produção.
            </p>
          )}
        </div>
      )}

      {step === "phone" && (
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="activation-phone">Número WhatsApp (com DDD)</Label>
            <Input
              id="activation-phone"
              placeholder="(11) 99999-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use o celular ou fixo que receberá SMS ou ligação com o código de 6 dígitos.
            </p>
          </div>

          <WhatsAppSenderPurposeSelect
            id="activation-purpose"
            value={purpose}
            onChange={setPurpose}
          />

          <div className="flex gap-2">
            <Button
              onClick={() => startMutation.mutate()}
              disabled={normalizeBrazilPhone(phone).length < 12 || startMutation.isPending}
            >
              {startMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Enviar código
            </Button>
            <Button variant="ghost" onClick={() => setStep("overview")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Digite o código de 6 dígitos enviado para{" "}
            <strong className="text-foreground">{otpDisplayPhone}</strong>.
          </p>

          <div className="space-y-2">
            <Label htmlFor="activation-otp">Código</Label>
            <Input
              id="activation-otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => verifyMutation.mutate()}
              disabled={otp.trim().length < 4 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Confirmar
            </Button>
            <Button
              variant="outline"
              onClick={() => resendMutation.mutate(false)}
              disabled={resendMutation.isPending}
            >
              Reenviar SMS
            </Button>
            <Button
              variant="ghost"
              onClick={() => resendMutation.mutate(true)}
              disabled={resendMutation.isPending}
            >
              Ligar com código
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3">
          {provisioningTimedOut ? (
            <QueryErrorState
              message="A configuração do número está demorando mais que o esperado."
              error="Webhook e templates ainda não foram concluídos. Tente atualizar ou contate o suporte."
              onRetry={() => {
                provisioningPolls.current = 0;
                setProvisioningTimedOut(false);
                void statusQuery.refetch();
              }}
            />
          ) : status && isProvisioningStatus(status.status) ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Configurando webhook e templates…
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
              Número conectado com sucesso.
            </div>
          )}

          <div className="flex gap-2">
            {verifiedSenderId && profileSender && (
              <Button variant="outline" onClick={() => setProfileOpen(true)}>
                Personalizar perfil WhatsApp
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setStep("overview");
                setVerifiedSenderId(null);
              }}
            >
              Concluir
            </Button>
          </div>
        </div>
      )}

      {step === "profile" && verifiedSenderId && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Opcional: defina foto, sobre e descrição — é o que o paciente vê no contato WhatsApp.
          </p>
          <Button variant="outline" onClick={() => setProfileOpen(true)}>
            Editar perfil do número
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("overview");
              setVerifiedSenderId(null);
            }}
          >
            Pular por agora
          </Button>
        </div>
      )}

      <WhatsappBusinessProfileEditor
        sender={profileSender}
        open={profileOpen}
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (!open && step === "profile") {
            setStep("overview");
            setVerifiedSenderId(null);
          }
        }}
      />
    </div>
  );
}
