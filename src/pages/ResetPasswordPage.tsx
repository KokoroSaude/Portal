import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { KokoroLogo } from "@/components/KokoroLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiClientError } from "@/lib/api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (!token) {
      toast.error("Link inválido. Solicite um novo reset de senha.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      toast.success("Senha redefinida. Faça login.");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <KokoroLogo variant="full" className="mx-auto mb-4" height={80} />
          <CardTitle className="font-serif text-2xl">Nova senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-center text-sm text-muted-foreground">
              Link inválido.{" "}
              <Link to="/login" className="text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando…" : "Redefinir senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
