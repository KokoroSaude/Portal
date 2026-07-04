import { Link } from "react-router-dom";
import { SettingsAiTab } from "@/components/settings/SettingsAiTab";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";

export function SettingsAiPage() {
  const { isAdmin, hasFeature } = useAuth();
  const { settings, form, update, save, savePending, isLoading } = useTenantSettingsForm();

  if (isLoading || !form || !settings) {
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
          title="Inteligência artificial"
          description="NLU no WhatsApp, insights nos relatórios e personalização de marcos."
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inteligência artificial"
        description="NLU no WhatsApp, insights nos relatórios e personalização de marcos."
      />

      <Card>
        <CardHeader>
          <CardTitle>Configurações de IA</CardTitle>
          <CardDescription>
            Ative copilot, mensagens de voz e leitura de receitas conforme o plano.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingsAiTab
            form={form}
            settings={settings}
            hasFeature={hasFeature}
            update={update}
          />
          <SettingsSaveButton onSave={save} pending={savePending} />
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/configuracoes/simulador">Abrir simulador conversacional</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
