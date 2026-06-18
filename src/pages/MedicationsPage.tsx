import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";

export function MedicationsPage() {
  const { token, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [canonicalName, setCanonicalName] = useState("");
  const [aliases, setAliases] = useState("");

  const medications = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createMedication(token!, {
        canonicalName: canonicalName.trim(),
        aliases: aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Medicamento cadastrado");
      setCanonicalName("");
      setAliases("");
      void queryClient.invalidateQueries({ queryKey: ["medications-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar"),
  });

  const backfillMutation = useMutation({
    mutationFn: () => api.backfillMedicationIds(token!),
    onSuccess: (result) => {
      toast.success(`Backfill: ${result.updated} atualizado(s), ${result.unmatched} sem match`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro no backfill"),
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Catálogo de medicamentos"
          description="Acesso restrito a administradores. O catálogo padroniza nomes entre filiais."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de medicamentos"
        description="Cadastro de nomes canônicos e aliases. Usado ao vincular planos de cuidado e para filtrar relatórios/programas com precisão."
        actions={
          <Button
            variant="outline"
            onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Vincular care plans
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Novo medicamento</CardTitle>
          <CardDescription>Aliases separados por vírgula (ex.: Glifage, metformina 850)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 max-w-xl">
          <div className="space-y-2">
            <Label>Nome canônico</Label>
            <Input
              value={canonicalName}
              onChange={(e) => setCanonicalName(e.target.value)}
              placeholder="Metformina"
            />
          </div>
          <div className="space-y-2">
            <Label>Aliases</Label>
            <Input
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Glifage, metformina 850"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !canonicalName.trim()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Medicamentos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {medications.isLoading && <Skeleton className="h-20 w-full" />}
          {(medications.data ?? []).map((med) => (
            <div key={med.id} className="rounded-md border p-3">
              <p className="font-medium">{med.canonicalName}</p>
              {med.aliases.length > 0 && (
                <p className="text-sm text-muted-foreground">Aliases: {med.aliases.join(", ")}</p>
              )}
            </div>
          ))}
          {medications.data?.length === 0 && !medications.isLoading && (
            <p className="text-sm text-muted-foreground">Nenhum medicamento no catálogo.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
