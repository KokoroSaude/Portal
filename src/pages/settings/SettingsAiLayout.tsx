import { Link, NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";
import { cn } from "@/lib/utils";

const AI_SETTINGS_TABS = [
  { to: "/configuracoes/ia/geral", label: "Geral" },
  { to: "/configuracoes/ia/mensagens", label: "Lembretes e marcos" },
  { to: "/configuracoes/ia/conversacao", label: "Conversação" },
] as const;

export function SettingsAiLayout() {
  const { isAdmin } = useAuth();
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
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Configurações de IA</CardTitle>
            <CardDescription>
              Ative copilot, mensagens de voz e leitura de receitas conforme o plano.
            </CardDescription>
          </div>
          <nav
            className="flex flex-wrap gap-1 border-b border-border pb-0"
            aria-label="Seções de configuração de IA"
          >
            {AI_SETTINGS_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "-mb-px rounded-t-md border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-border border-b-background bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </CardHeader>
        <CardContent className="space-y-6">
          <Outlet context={{ form, settings, update, save, savePending }} />
          <SettingsSaveButton onSave={save} pending={savePending} />
        </CardContent>
      </Card>
    </div>
  );
}

export type SettingsAiOutletContext = {
  form: NonNullable<ReturnType<typeof useTenantSettingsForm>["form"]>;
  settings: NonNullable<ReturnType<typeof useTenantSettingsForm>["settings"]>;
  update: ReturnType<typeof useTenantSettingsForm>["update"];
  save: ReturnType<typeof useTenantSettingsForm>["save"];
  savePending: boolean;
};
