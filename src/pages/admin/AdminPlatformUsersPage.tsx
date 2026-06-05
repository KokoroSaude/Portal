import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

export function AdminPlatformUsersPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const createMutation = useMutation({
    mutationFn: () => api.adminCreatePlatformUser(token!, form.name, form.email, form.password),
    onSuccess: () => {
      toast.success("Superadmin criado");
      setForm({ name: "", email: "", password: "" });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Superadmins" description="Usuários com acesso à plataforma Kokoro" />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Criar superadmin</CardTitle>
          <CardDescription>
            Contas seed: keinagata@, gabriela@, thiagokeller@kokorosaude.com.br (Super@123) · tenants freemium@, premium@, enterprise@ (Admin@123)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            Criar usuário
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
