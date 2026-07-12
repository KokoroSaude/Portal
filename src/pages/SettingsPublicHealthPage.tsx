import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";
import { hasModule } from "@/lib/tenant-modules";
import type { PublicHealthUnit } from "@/types/api";

export function SettingsPublicHealthPage() {
  const { isAdmin } = useAuth();
  const { form, update, save, savePending, isLoading } = useTenantSettingsForm();
  const canManageUnits =
    !!form &&
    (hasModule("PharmacyPickup", form) || hasModule("PopulationHealth", form));

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canManageUnits) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Unidades de saúde (CNES)"
          description="Cadastro multi-unidade para operações com retirada ou gestão populacional."
        />
        <Card>
          <CardHeader>
            <CardTitle>Indisponível</CardTitle>
            <CardDescription>
              Habilite o módulo <strong>Retirada em farmácia</strong> ou{" "}
              <strong>Gestão populacional</strong> na organização para configurar unidades CNES.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/configuracoes">Voltar às configurações</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Unidades de saúde (CNES)" />
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Apenas administradores podem editar unidades CNES.
          </CardContent>
        </Card>
      </div>
    );
  }

  const units = form.publicHealthUnits ?? [];

  function patchUnits(next: PublicHealthUnit[]) {
    update("publicHealthUnits", next);
  }

  function addUnit() {
    patchUnits([...units, { cnesCode: "", name: "", isActive: true }]);
  }

  function removeUnit(index: number) {
    patchUnits(units.filter((_, i) => i !== index));
  }

  function updateUnit(index: number, patch: Partial<PublicHealthUnit>) {
    patchUnits(units.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades de saúde (CNES)"
        description="Cadastre múltiplas unidades vinculadas à organização para operação SUS em escala."
        actions={<SettingsSaveButton pending={savePending} onSave={save} />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-lg">Unidades</CardTitle>
            <CardDescription>Código CNES, nome e status ativo por unidade.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addUnit}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma unidade cadastrada. Use o CNES principal em Config. retirada ou adicione aqui.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CNES</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ativa</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={unit.cnesCode}
                        onChange={(e) => updateUnit(index, { cnesCode: e.target.value })}
                        placeholder="0000000"
                        maxLength={7}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={unit.name}
                        onChange={(e) => updateUnit(index, { name: e.target.value })}
                        placeholder="UBS Centro"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={unit.isActive}
                          onCheckedChange={(v) => updateUnit(index, { isActive: v })}
                        />
                        <Label className="sr-only">Ativa</Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUnit(index)}
                        aria-label="Remover unidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
