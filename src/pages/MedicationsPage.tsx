import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import type { MedicationCatalogItem } from "@/types/api";

export function MedicationsPage() {
  const { token, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [canonicalName, setCanonicalName] = useState("");
  const [aliases, setAliases] = useState("");
  const [catmatCode, setCatmatCode] = useState("");
  const [clinicalPriorityBoost, setClinicalPriorityBoost] = useState("0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCatmat, setEditCatmat] = useState("");
  const [editBoost, setEditBoost] = useState("0");
  const [editIndication, setEditIndication] = useState("");
  const [editWhyNotSkip, setEditWhyNotSkip] = useState("");
  const [editPharmacistCta, setEditPharmacistCta] = useState(false);

  const medications = useQuery({
    queryKey: ["medications-catalog"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token,
  });

  const { govMode } = useTenantSettings();

  const createMutation = useMutation({
    mutationFn: () =>
      api.createMedication(token!, {
        canonicalName: canonicalName.trim(),
        catmatCode: govMode ? catmatCode.trim() || undefined : undefined,
        clinicalPriorityBoost: govMode ? Number(clinicalPriorityBoost) || 0 : undefined,
        aliases: aliases
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Medicamento cadastrado");
      setCanonicalName("");
      setAliases("");
      setCatmatCode("");
      setClinicalPriorityBoost("0");
      void queryClient.invalidateQueries({ queryKey: ["medications-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao cadastrar"),
  });

  const updateMutation = useMutation({
    mutationFn: (med: MedicationCatalogItem) =>
      api.updateMedication(token!, med.id, {
        catmatCode: govMode ? editCatmat.trim() || undefined : undefined,
        clinicalPriorityBoost: govMode ? Number(editBoost) || 0 : undefined,
        indicationSummary: editIndication.trim() || null,
        whyNotSkip: editWhyNotSkip.trim() || null,
        pharmacistCtaEnabled: editPharmacistCta,
      }),
    onSuccess: () => {
      toast.success("Medicamento atualizado");
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["medications-catalog"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao atualizar"),
  });

  const backfillMutation = useMutation({
    mutationFn: () => api.backfillMedicationIds(token!),
    onSuccess: (result) => {
      toast.success(`Backfill: ${result.updated} atualizado(s), ${result.unmatched} sem match`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro no backfill"),
  });

  function startEdit(med: MedicationCatalogItem) {
    setEditingId(med.id);
    setEditCatmat(med.catmatCode ?? "");
    setEditBoost(String(med.clinicalPriorityBoost ?? 0));
    setEditIndication(med.indicationSummary ?? "");
    setEditWhyNotSkip(med.whyNotSkip ?? "");
    setEditPharmacistCta(med.pharmacistCtaEnabled ?? false);
  }

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
        description={
          govMode
            ? "Cadastro de nomes canônicos, CATMAT e prioridade clínica para fila SUS."
            : "Cadastro de nomes canônicos e aliases para padronizar medicamentos entre filiais."
        }
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
        <CardContent className="grid max-w-xl gap-4">
          <div className="space-y-2">
            <Label>Nome canônico</Label>
            <Input
              value={canonicalName}
              onChange={(e) => setCanonicalName(e.target.value)}
              placeholder="Metformina"
            />
          </div>
          {govMode && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Código CATMAT</Label>
                <Input
                  value={catmatCode}
                  onChange={(e) => setCatmatCode(e.target.value)}
                  placeholder="Opcional — exigido se regras SUS ativas"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade clínica (boost)</Label>
                <Input
                  type="number"
                  min={0}
                  value={clinicalPriorityBoost}
                  onChange={(e) => setClinicalPriorityBoost(e.target.value)}
                />
              </div>
            </div>
          )}
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{med.canonicalName}</p>
                  {med.aliases.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aliases: {med.aliases.join(", ")}
                    </p>
                  )}
                  {editingId === med.id ? (
                    <div className="mt-3 grid gap-3">
                      {govMode && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">CATMAT</Label>
                            <Input value={editCatmat} onChange={(e) => setEditCatmat(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Boost prioridade</Label>
                            <Input
                              type="number"
                              min={0}
                              value={editBoost}
                              onChange={(e) => setEditBoost(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs">Indicação (curada — card WhatsApp)</Label>
                        <Input
                          value={editIndication}
                          onChange={(e) => setEditIndication(e.target.value)}
                          placeholder="Ex.: controla a glicose e previne complicações"
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Por que não pular</Label>
                        <Input
                          value={editWhyNotSkip}
                          onChange={(e) => setEditWhyNotSkip(e.target.value)}
                          placeholder="Ex.: sem o remédio a pressão sobe e o risco de AVC aumenta"
                          maxLength={500}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editPharmacistCta}
                          onChange={(e) => setEditPharmacistCta(e.target.checked)}
                        />
                        CTA farmacêutico no card
                      </label>
                      {editIndication.trim() && (
                        <div className="rounded-md bg-muted/40 p-3 text-xs">
                          <p className="mb-1 font-medium">Preview WhatsApp</p>
                          <p>
                            💊 *{med.canonicalName}*: {editIndication.trim()}
                            {editWhyNotSkip.trim() ? ` ${editWhyNotSkip.trim()}` : ""}
                          </p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-fit"
                        onClick={() => updateMutation.mutate(med)}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="mr-1 size-3.5" />
                        Salvar
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {govMode && (
                        <p>
                          CATMAT: {med.catmatCode ?? "—"} · Boost: {med.clinicalPriorityBoost ?? 0}
                        </p>
                      )}
                      {med.indicationSummary ? (
                        <p>Card: {med.indicationSummary}</p>
                      ) : (
                        <p>Sem card de indicação curado</p>
                      )}
                    </div>
                  )}
                </div>
                {editingId !== med.id && (
                  <Button variant="ghost" size="icon" onClick={() => startEdit(med)}>
                    <Pencil className="size-4" />
                  </Button>
                )}
              </div>
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
