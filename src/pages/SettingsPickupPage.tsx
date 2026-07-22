import { Link } from "react-router-dom";
import { SettingsPickupTab } from "@/components/settings/SettingsPickupTab";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";
import { isGovPharmacyMode } from "@/lib/gov-pharmacy";

export function SettingsPickupPage() {
  const { isAdmin } = useAuth();
  const { form, update, save, savePending, isLoading, isError, error, refetch } =
    useTenantSettingsForm();
  const govMode = form ? isGovPharmacyMode(form) : false;

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Retirada de medicamentos</h1>
        <QueryErrorState
          message="Não foi possível carregar as configurações."
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Retirada de medicamentos"
          description="Configurações de fila, notificações e integração ERP."
        />
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Configurações operacionais são gerenciadas pelo administrador da organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/perfil">Ir para meu perfil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!govMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Retirada de medicamentos"
          description="Configurações de fila, notificações e integração ERP."
        />
        <Card>
          <CardHeader>
            <CardTitle>Indisponível</CardTitle>
            <CardDescription>
              As configurações de retirada estão disponíveis apenas para organizações em modo
              farmácia governamental (SUS).
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retirada de medicamentos"
        description="Fila, notificações, integração ERP, painel TV e regras SUS."
      />

      <Card>
        <CardHeader>
          <CardTitle>Retirada gov</CardTitle>
          <CardDescription>
            Parâmetros operacionais da fila de retirada e integrações externas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingsPickupTab form={form} update={update} />
          <SettingsSaveButton onSave={save} pending={savePending} />
        </CardContent>
      </Card>
    </div>
  );
}
