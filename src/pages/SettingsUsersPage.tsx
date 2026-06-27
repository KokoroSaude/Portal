import { Link } from "react-router-dom";
import { SettingsUsersTab } from "@/components/settings/SettingsUsersTab";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";

export function SettingsUsersPage() {
  const { isAdmin, hasFeature } = useAuth();
  const usersEnabled = hasFeature(FEATURE_KEYS.usersManage);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Usuários" description="Convide e gerencie acessos da organização." />
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

  if (!usersEnabled) {
    return (
      <div className="space-y-6">
        <PageHeader title="Usuários" description="Convide e gerencie acessos da organização." />
        <FeatureLocked
          title="Gestão de usuários não disponível"
          description="Este recurso não está incluído no seu plano atual."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" description="Convide e gerencie acessos da organização." />

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>Perfis de acesso, convites e permissões.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsUsersTab />
        </CardContent>
      </Card>
    </div>
  );
}
