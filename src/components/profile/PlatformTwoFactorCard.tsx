import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

type SetupStep = "idle" | "scan" | "confirm" | "recovery";

export function PlatformTwoFactorCard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const [disableOpen, setDisableOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [actionPassword, setActionPassword] = useState("");
  const [actionCode, setActionCode] = useState("");

  const statusQuery = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: () => api.getTwoFactorStatus(token!),
    enabled: !!token,
  });

  const beginMutation = useMutation({
    mutationFn: () => api.beginTwoFactorSetup(token!),
    onSuccess: (res) => {
      setSetupSecret(res.secret);
      setSetupStep("scan");
      setConfirmCode("");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao iniciar 2FA"),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.confirmTwoFactorSetup(token!, confirmCode),
    onSuccess: (res) => {
      setRecoveryCodes(res.recoveryCodes);
      setSetupStep("recovery");
      setSetupSecret(null);
      setConfirmCode("");
      void queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      toast.success("Autenticação em duas etapas ativada");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Código inválido"),
  });

  const disableMutation = useMutation({
    mutationFn: () => api.disableTwoFactor(token!, actionPassword, actionCode),
    onSuccess: () => {
      setDisableOpen(false);
      resetActionForm();
      void queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      toast.success("Autenticação em duas etapas desativada");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Não foi possível desativar"),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.regenerateRecoveryCodes(token!, actionPassword, actionCode),
    onSuccess: (res) => {
      setRegenerateOpen(false);
      resetActionForm();
      setRecoveryCodes(res.recoveryCodes);
      setSetupStep("recovery");
      void queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      toast.success("Novos códigos de recuperação gerados");
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Não foi possível gerar códigos"),
  });

  function resetActionForm() {
    setActionPassword("");
    setActionCode("");
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const enabled = statusQuery.data?.enabled ?? false;
  const recoveryRemaining = statusQuery.data?.recoveryCodesRemaining ?? 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Shield className="size-5" />
              Autenticação em duas etapas
            </CardTitle>
            {enabled ? (
              <Badge variant="success">
                <ShieldCheck className="mr-1 size-3" />
                Ativa
              </Badge>
            ) : (
              <Badge variant="muted">Inativa</Badge>
            )}
          </div>
          <CardDescription>
            Proteja o acesso de superadmin com um app autenticador (Google Authenticator, Authy,
            etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabled && (
            <p className="text-sm text-muted-foreground">
              Códigos de recuperação restantes:{" "}
              <span className="font-medium text-foreground">{recoveryRemaining}</span>
            </p>
          )}

          {setupStep === "idle" && !enabled && (
            <Button
              type="button"
              onClick={() => beginMutation.mutate()}
              disabled={beginMutation.isPending || statusQuery.isLoading}
            >
              {beginMutation.isPending ? "Preparando…" : "Ativar 2FA"}
            </Button>
          )}

          {setupStep === "scan" && setupSecret && (
            <div className="max-w-md space-y-4 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm">
                Adicione uma nova conta no seu app autenticador e informe esta chave manualmente:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-background px-3 py-2 text-sm font-mono">
                  {setupSecret}
                </code>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => void copyText(setupSecret, "Chave")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-code">Código de 6 dígitos</Label>
                <Input
                  id="setup-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending || confirmCode.length < 6}
                >
                  {confirmMutation.isPending ? "Confirmando…" : "Confirmar e ativar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSetupStep("idle");
                    setSetupSecret(null);
                    setConfirmCode("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {setupStep === "recovery" && recoveryCodes && (
            <div className="max-w-md space-y-3 rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-amber-900">
                Guarde estes códigos de recuperação em local seguro. Cada um só pode ser usado uma
                vez.
              </p>
              <ul className="grid gap-1 font-mono text-sm sm:grid-cols-2">
                {recoveryCodes.map((code) => (
                  <li key={code} className="rounded bg-background px-2 py-1">
                    {code}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                onClick={() => void copyText(recoveryCodes.join("\n"), "Códigos")}
              >
                <Copy className="size-4" />
                Copiar todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRecoveryCodes(null);
                  setSetupStep("idle");
                }}
              >
                Entendi, fechar
              </Button>
            </div>
          )}

          {enabled && setupStep === "idle" && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setRegenerateOpen(true)}>
                Gerar novos códigos de recuperação
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDisableOpen(true)}>
                <ShieldOff className="size-4" />
                Desativar 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) resetActionForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar autenticação em duas etapas</DialogTitle>
            <DialogDescription>
              Confirme sua senha e um código do app autenticador para desativar o 2FA.
            </DialogDescription>
          </DialogHeader>
          <ActionFields
            password={actionPassword}
            code={actionCode}
            onPasswordChange={setActionPassword}
            onCodeChange={setActionCode}
          />
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={disableMutation.isPending || !actionPassword || actionCode.length < 6}
              onClick={() => disableMutation.mutate()}
            >
              {disableMutation.isPending ? "Desativando…" : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={regenerateOpen}
        onOpenChange={(open) => {
          setRegenerateOpen(open);
          if (!open) resetActionForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar novos códigos de recuperação</DialogTitle>
            <DialogDescription>
              Os códigos anteriores deixarão de funcionar. Confirme com senha e código TOTP.
            </DialogDescription>
          </DialogHeader>
          <ActionFields
            password={actionPassword}
            code={actionCode}
            onPasswordChange={setActionPassword}
            onCodeChange={setActionCode}
          />
          <DialogFooter>
            <Button
              disabled={regenerateMutation.isPending || !actionPassword || actionCode.length < 6}
              onClick={() => regenerateMutation.mutate()}
            >
              {regenerateMutation.isPending ? "Gerando…" : "Gerar códigos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionFields({
  password,
  code,
  onPasswordChange,
  onCodeChange,
}: {
  password: string;
  code: string;
  onPasswordChange: (v: string) => void;
  onCodeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="2fa-password">Senha atual</Label>
        <PasswordInput
          id="2fa-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="2fa-code">Código do autenticador</Label>
        <Input
          id="2fa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          value={code}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
        />
      </div>
    </div>
  );
}
