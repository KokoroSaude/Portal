import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { KokoroLogo } from "@/components/KokoroLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tenantName: "",
    tenantSlug: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "tenantName" && !slugTouched) {
        next.tenantSlug = slugify(value);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createTenant(form);
      const outcome = await login(form.adminEmail, form.adminPassword);
      if (outcome.status === "two_factor") {
        toast.success("Conta criada. Conclua a verificação em duas etapas no login.");
        navigate("/login");
        return;
      }
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Erro ao criar tenant";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[min(480px,42%)] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-[#E85F5F] p-10 text-primary-foreground lg:flex xl:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5" aria-hidden />

        <KokoroLogo variant="onCoral" />

        <div className="relative z-10 max-w-sm">
          <h1 className="font-serif text-4xl leading-tight xl:text-[2.75rem]">
            Comece hoje.
            <br />
            <span className="italic opacity-90">Sem fricção.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-primary-foreground/85">
            Cadastre sua farmácia ou clínica e acompanhe a adesão dos pacientes pelo WhatsApp.
          </p>
        </div>

        <p className="relative z-10 text-sm text-primary-foreground/65">
          Já tem conta?{" "}
          <Link to="/login" className="underline underline-offset-2 hover:opacity-90">
            Entrar
          </Link>
        </p>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className="mb-8 lg:hidden">
          <KokoroLogo variant="full" className="mx-auto" />
        </div>

        <Card className="w-full max-w-lg border border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Criar tenant</CardTitle>
            <CardDescription>
              Cadastre sua organização e o usuário administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tenantName">Nome da organização</Label>
                  <Input
                    id="tenantName"
                    value={form.tenantName}
                    onChange={(e) => update("tenantName", e.target.value)}
                    placeholder="Farmácia Exemplo"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tenantSlug">Slug (identificador único)</Label>
                  <Input
                    id="tenantSlug"
                    value={form.tenantSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      update("tenantSlug", slugify(e.target.value));
                    }}
                    placeholder="farmacia-exemplo"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="adminName">Seu nome</Label>
                  <Input
                    id="adminName"
                    value={form.adminName}
                    onChange={(e) => update("adminName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">E-mail admin</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => update("adminEmail", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Senha</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => update("adminPassword", e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando…" : "Criar conta"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground lg:hidden">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
