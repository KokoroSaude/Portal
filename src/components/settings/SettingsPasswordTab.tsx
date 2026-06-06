import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

export function SettingsPasswordTab() {
  const { token } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

  const mutation = useMutation({
    mutationFn: () => api.changePassword(token!, form.current, form.next),
    onSuccess: () => {
      toast.success("Senha alterada");
      setForm({ current: "", next: "", confirm: "" });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Erro"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    if (form.next.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current">Senha atual</Label>
        <Input
          id="current"
          type="password"
          value={form.current}
          onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">Nova senha</Label>
        <Input
          id="next"
          type="password"
          value={form.next}
          onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          required
        />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Salvando…" : "Alterar senha"}
      </Button>
    </form>
  );
}
