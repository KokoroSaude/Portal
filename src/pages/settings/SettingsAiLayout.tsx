import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/QueryErrorState";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettingsForm } from "@/hooks/useTenantSettingsForm";
import { cn } from "@/lib/utils";

const AI_SETTINGS_TABS = [
  { to: "/configuracoes/ia/geral", label: "Geral" },
  { to: "/configuracoes/ia/prompts", label: "Prompts IA" },
  { to: "/configuracoes/ia/mensagens", label: "Lembretes e marcos" },
  { to: "/configuracoes/ia/conversacao/modos", label: "Conversação" },
] as const;

export function SettingsAiLayout() {
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  const { settings, form, update, save, savePending, isLoading, isError, error, refetch } =
    useTenantSettingsForm();

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Inteligência artificial</h1>
        <QueryErrorState
          message="Não foi possível carregar as configurações."
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

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
            {AI_SETTINGS_TABS.map((tab) => {
              const isConversationTab = tab.to.startsWith("/configuracoes/ia/conversacao");
              const isActive = isConversationTab
                ? pathname.startsWith("/configuracoes/ia/conversacao")
                : pathname === tab.to;

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={() =>
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
              );
            })}
          </nav>
        </CardHeader>
        <CardContent className="space-y-6">
          <Outlet context={{ form, settings, update, save, savePending }} />
          {!pathname.endsWith("/prompts") ? (
            <SettingsSaveButton onSave={save} pending={savePending} />
          ) : null}
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
