import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { SettingsField } from "@/components/settings/SettingsField";
import { API_BASE } from "@/lib/config";

type ErpSimulatorCardProps = {
  apiKey?: string | null;
};

async function callExternalPickup(
  apiKey: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${API_BASE}/api/external/pickup${path}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Pickup-Api-Key": apiKey,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  return { ok: res.ok, status: res.status, data };
}

export function ErpSimulatorCard({ apiKey: initialApiKey }: ErpSimulatorCardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey ?? "");
  const [medicationId, setMedicationId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState<"stock" | "complete" | null>(null);

  async function simulateStockArrival() {
    if (!apiKey.trim()) {
      toast.error("Informe a chave API do ERP.");
      return;
    }
    if (!medicationId.trim()) {
      toast.error("Informe o ID do medicamento.");
      return;
    }

    setLoading("stock");
    try {
      const result = await callExternalPickup(apiKey.trim(), "/stock-arrival", {
        medicationId: medicationId.trim(),
        quantity: Number(quantity) || 1,
        externalReference: `sim-${Date.now()}`,
        notifyOnArrival: false,
      });
      if (result.ok) {
        toast.success("Chegada de estoque simulada com sucesso.");
      } else {
        const err = result.data as { error?: string };
        toast.error(err?.error ?? `Erro ${result.status}`);
      }
    } catch {
      toast.error("Falha ao chamar a API externa.");
    } finally {
      setLoading(null);
    }
  }

  async function simulateComplete() {
    if (!apiKey.trim()) {
      toast.error("Informe a chave API do ERP.");
      return;
    }
    if (!cpf.trim()) {
      toast.error("Informe o CPF do paciente.");
      return;
    }

    setLoading("complete");
    try {
      const result = await callExternalPickup(apiKey.trim(), "/complete", {
        cpf: cpf.trim(),
        medicationId: medicationId.trim() || undefined,
        quantity: Number(quantity) || 1,
        externalReference: `sim-${Date.now()}`,
      });
      if (result.ok) {
        toast.success("Retirada concluída com sucesso.");
      } else {
        const err = result.data as { error?: string; title?: string };
        toast.error(err?.error ?? err?.title ?? `Erro ${result.status}`);
      }
    } catch {
      toast.error("Falha ao chamar a API externa.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Simulador ERP</CardTitle>
        <CardDescription>
          Teste as rotas externas com a chave gerada. As chamadas vão para a API real do tenant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SettingsField
          label="Chave API"
          hint="Cole a chave exibida na geração. Não é armazenada neste formulário após recarregar a página."
        >
          <PasswordInput
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="kok_erp_..."
          />
        </SettingsField>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="erp-sim-medication">ID do medicamento</Label>
            <Input
              id="erp-sim-medication"
              value={medicationId}
              onChange={(e) => setMedicationId(e.target.value)}
              placeholder="UUID do catálogo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="erp-sim-quantity">Quantidade</Label>
            <Input
              id="erp-sim-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="erp-sim-cpf">CPF (conclusão)</Label>
          <Input
            id="erp-sim-cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="Somente números"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading !== null}
            onClick={() => void simulateStockArrival()}
          >
            {loading === "stock" ? "Enviando…" : "Simular chegada de estoque"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading !== null}
            onClick={() => void simulateComplete()}
          >
            {loading === "complete" ? "Enviando…" : "Simular conclusão de retirada"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
