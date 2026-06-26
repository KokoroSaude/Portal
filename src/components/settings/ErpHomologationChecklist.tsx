import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { ErpConnectionTestResult, TenantSettings } from "@/types/api";
import { cn } from "@/lib/utils";

type ErpHomologationChecklistProps = {
  form: TenantSettings;
  testResult: ErpConnectionTestResult | null;
};

type ChecklistItem = {
  label: string;
  done: boolean;
};

export function ErpHomologationChecklist({ form, testResult }: ErpHomologationChecklistProps) {
  const { token } = useAuth();

  const credentialsQuery = useQuery({
    queryKey: ["erp-credentials", "checklist"],
    queryFn: () => api.listErpCredentials(token!),
    enabled: !!token,
    staleTime: 30_000,
  });

  const medicationsQuery = useQuery({
    queryKey: ["medications", "erp-checklist"],
    queryFn: () => api.listMedications(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const activeMedications = (medicationsQuery.data ?? []).filter((m) => m.isActive);
  const medicationsWithCatmat =
    activeMedications.length > 0 &&
    activeMedications.every((m) => Boolean(m.catmatCode?.trim()));

  const items: ChecklistItem[] = [
    {
      label: "CNES configurado",
      done: Boolean(form.pickupCnesCode?.trim()),
    },
    {
      label: "Medicamentos com CATMAT",
      done: medicationsWithCatmat,
    },
    {
      label: "Chave ERP gerada",
      done: (credentialsQuery.data?.length ?? 0) > 0,
    },
    {
      label: "Teste de conexão OK",
      done: testResult?.success === true,
    },
  ];

  const completed = items.filter((i) => i.done).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Checklist de homologação</CardTitle>
        <CardDescription>
          {completed} de {items.length} itens concluídos antes de ir para produção com o ERP.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              item.done ? "border-emerald-200 bg-emerald-50/60" : "border-border",
            )}
          >
            {item.done ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
