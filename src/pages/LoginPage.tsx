import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KokoroLogo } from "@/components/KokoroLogo";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login realizado");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Falha no login";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Barra lateral — identidade Kokoro */}
      <aside className="relative hidden w-[min(480px,42%)] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-[#E85F5F] p-10 text-primary-foreground lg:flex xl:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5" aria-hidden />

        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <KokoroLogo variant="onCoral" height={88} />
        </div>

        <div className="relative z-10 max-w-sm">
          <h1 className="font-serif text-4xl leading-tight xl:text-[2.75rem]">
            Mais adesão.
            <br />
            <span className="italic opacity-90">Mais vida.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-primary-foreground/85">
            Acompanhe pacientes, adesão e interações do seu programa de medicamentos via WhatsApp.
          </p>
        </div>

        <p className="relative z-10 text-sm text-primary-foreground/65">
          Portal Kokoro · LGPD by design
        </p>
      </aside>

      {/* Formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="mb-8 flex w-full justify-center lg:hidden">
          <KokoroLogo variant="full" height={120} />
        </div>

        <Card className="w-full max-w-md shadow-soft-lg">
          <CardHeader className="space-y-1 pb-2 text-center">
            <CardTitle className="font-serif text-2xl">Entrar</CardTitle>
            <CardDescription>
              Entre com o e-mail e a senha da sua organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Esqueci a senha
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recuperar senha</DialogTitle>
                        <DialogDescription>
                          Informe seu e-mail. Se estiver cadastrado, enviaremos instruções. Caso
                          contrário, contate o administrador da sua organização.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">E-mail</Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={async () => {
                            setForgotLoading(true);
                            try {
                              const res = await api.forgotPassword(forgotEmail);
                              toast.success(res.message);
                              setForgotOpen(false);
                              setForgotEmail("");
                            } catch (err) {
                              toast.error(
                                err instanceof ApiClientError ? err.message : "Erro ao solicitar",
                              );
                            } finally {
                              setForgotLoading(false);
                            }
                          }}
                          disabled={forgotLoading || !forgotEmail}
                        >
                          {forgotLoading ? "Enviando…" : "Enviar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
