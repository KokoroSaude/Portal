import { NavLink, Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  FileText,
  GitBranch,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { KokoroLogo } from "@/components/KokoroLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { SidebarCollapsedFlyout } from "@/components/layout/SidebarCollapsedFlyout";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FEATURE_KEYS } from "@/lib/constants";
import { APP_VERSION } from "@/lib/version";
import { tourNavId } from "@/lib/tours";
import { cn } from "@/lib/utils";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  feature?: string;
  adminOnly?: boolean;
};

export const TENANT_NAV: NavItem[] = [
  { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, feature: FEATURE_KEYS.reportsBasic },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, feature: FEATURE_KEYS.reportsBasic },
  { to: "/templates", label: "Templates", icon: FileText, feature: FEATURE_KEYS.templatesCustomRead },
  { to: "/jornada", label: "Jornada", icon: GitBranch, feature: FEATURE_KEYS.journeyOnboardingRead },
  { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export const PLATFORM_NAV: NavItem[] = [
  { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
  { to: "/", label: "Visão geral", icon: Shield, end: true },
  { to: "/admin/planos", label: "Planos", icon: Layers },
  { to: "/admin/tenants", label: "Tenants", icon: Building2 },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/features", label: "Features", icon: Shield },
  { to: "/admin/usuarios", label: "Superadmins", icon: Users },
  { to: "/admin/onboarding", label: "Onboarding WhatsApp", icon: GitBranch },
  { to: "/admin/mensagens", label: "Mensagens operacionais", icon: FileText },
  { to: "/admin/simulador", label: "Simulador", icon: MessageCircle },
  { to: "/admin/assinatura", label: "Assinatura e-mail", icon: Mail },
];

function countVisibleNavItems(
  items: NavItem[],
  hasFeature: (key: string) => boolean,
  isAdmin: boolean,
): number {
  return items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.feature && !hasFeature(item.feature)) return false;
    return true;
  }).length;
}

function FreemiumUpgradeHint({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <SidebarCollapsedFlyout collapsed label="Upgrade de plano" description="Desbloqueie mais recursos">
        <Link
          to="/configuracoes?tab=plano"
          className="flex size-9 items-center justify-center rounded-lg text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
          aria-label="Upgrade de plano"
        >
          <Sparkles className="size-4" />
        </Link>
      </SidebarCollapsedFlyout>
    );
  }

  return (
    <Link
      to="/configuracoes?tab=plano"
      className="block rounded-xl border border-white/25 bg-white/10 p-3 text-primary-foreground transition-colors hover:bg-white/15"
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold leading-snug">Desbloqueie mais recursos</p>
          <p className="text-xs text-primary-foreground/75">
            Relatórios, templates, jornada e mais números WhatsApp no plano superior.
          </p>
        </div>
      </div>
    </Link>
  );
}

function NavSection({
  title,
  items,
  hasFeature,
  isAdmin,
  onNavigate,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const visible = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.feature && !hasFeature(item.feature)) return false;
    return true;
  });
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1" data-tour="sidebar-nav">
      {!collapsed && (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/55">
          {title}
        </p>
      )}
      {visible.map(({ to, label, icon: Icon, end }) => (
        <SidebarCollapsedFlyout
          key={to}
          collapsed={collapsed}
          label={label}
          description={collapsed ? title : undefined}
        >
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            data-tour={tourNavId(to)}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "gap-3 px-3",
                isActive
                  ? "bg-white/20 text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && label}
          </NavLink>
        </SidebarCollapsedFlyout>
      ))}
    </div>
  );
}

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  onLogout?: () => void;
  collapsed?: boolean;
  collapsible?: boolean;
  onToggleCollapsed?: () => void;
};

export function AppSidebar({
  className,
  onNavigate,
  onLogout,
  collapsed = false,
  collapsible = false,
  onToggleCollapsed,
}: AppSidebarProps) {
  const { displayName, logout, auth, hasFeature, isPlatform, isTenant, isAdmin, role, avatarUrl } =
    useAuth();

  const email = auth?.user?.email ?? auth?.platformUser?.email;

  const visibleTenantNavCount = isTenant
    ? countVisibleNavItems(TENANT_NAV, hasFeature, isAdmin)
    : TENANT_NAV.length;
  const showFreemiumHint = isTenant && visibleTenantNavCount <= 5;

  const handleLogout = () => {
    onNavigate?.();
    logout();
    onLogout?.();
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-[#E85F5F] text-primary-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5" aria-hidden />

      <div
        className={cn(
          "relative z-10 flex flex-col items-center text-center",
          collapsed ? "px-2 py-4" : "px-6 py-5",
        )}
      >
        {collapsible && !collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-8 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            aria-label="Recolher menu"
            onClick={onToggleCollapsed}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
        <KokoroLogo variant="onCoral" to="/" height={collapsed ? 32 : 56} />
        {!collapsed && <p className="mt-2 text-xs text-primary-foreground/70">Portal</p>}
        {collapsible && collapsed && (
          <SidebarCollapsedFlyout collapsed label="Expandir menu">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-2 size-8 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
              aria-label="Expandir menu"
              onClick={onToggleCollapsed}
            >
              <PanelLeft className="size-4" />
            </Button>
          </SidebarCollapsedFlyout>
        )}
      </div>

      <Separator className="relative z-10 bg-white/20" />

      <nav className={cn("relative z-10 flex flex-1 flex-col gap-4 overflow-y-auto", collapsed ? "p-2" : "p-4")}>
        {isTenant && (
          <>
            <NavSection
              title="Operação"
              items={TENANT_NAV}
              hasFeature={hasFeature}
              isAdmin={isAdmin}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
            {showFreemiumHint && <FreemiumUpgradeHint collapsed={collapsed} />}
          </>
        )}
        {isPlatform && (
          <NavSection
            title="Plataforma"
            items={PLATFORM_NAV}
            hasFeature={() => true}
            isAdmin
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}
      </nav>

      <div className={cn("relative z-10 border-t border-white/20", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <SidebarCollapsedFlyout
              collapsed
              label={displayName}
              description={
                email
                  ? `${email} · ${isPlatform ? "Superadmin" : role ?? "Tenant"}`
                  : isPlatform
                    ? "Superadmin"
                    : (role ?? "Tenant")
              }
            >
              <NavLink to="/perfil" onClick={onNavigate} aria-label="Meu perfil">
                <UserAvatar
                  name={displayName}
                  avatarUrl={avatarUrl}
                  className="size-8 shrink-0"
                  fallbackClassName="bg-white/20 text-xs text-primary-foreground"
                />
              </NavLink>
            </SidebarCollapsedFlyout>
            <SidebarCollapsedFlyout collapsed label="Sair">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
                aria-label="Sair"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
              </Button>
            </SidebarCollapsedFlyout>
          </div>
        ) : (
          <>
            <NavLink
              to="/perfil"
              onClick={onNavigate}
              className="mb-3 flex items-center gap-3 rounded-lg transition-colors hover:bg-white/10"
            >
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                className="size-8 shrink-0"
                fallbackClassName="bg-white/20 text-xs text-primary-foreground"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-primary-foreground/70">{email}</p>
                <Badge className="mt-1 border-white/30 bg-white/15 text-[10px] text-primary-foreground hover:bg-white/15">
                  {isPlatform ? "Superadmin" : role ?? "Tenant"}
                </Badge>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
            <p className="mt-3 text-center text-[10px] text-primary-foreground/50">v{APP_VERSION}</p>
          </>
        )}
      </div>
    </div>
  );
}
