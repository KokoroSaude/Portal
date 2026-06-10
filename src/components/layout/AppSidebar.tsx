import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  GitBranch,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Shield,
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
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  feature?: string;
  adminOnly?: boolean;
  children?: NavItem[];
};

export const TENANT_NAV: NavItem[] = [
  { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, feature: FEATURE_KEYS.reportsBasic },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/whatsapp/conversas", label: "Conversas com pacientes", icon: MessageCircle },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, feature: FEATURE_KEYS.reportsBasic },
  { to: "/templates", label: "Templates", icon: FileText, feature: FEATURE_KEYS.templatesCustomRead },
  { to: "/jornada", label: "Jornada", icon: GitBranch, feature: FEATURE_KEYS.journeyOnboardingRead },
  { to: "/whatsapp/configuracao", label: "Configuração WhatsApp", icon: Settings },
  { to: "/morisky", label: "MMAS-8 (Morisky)", icon: ClipboardList, adminOnly: true },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export const PLATFORM_NAV: NavItem[] = [
  { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
  { to: "/", label: "Visão geral", icon: Shield, end: true },
  { to: "/admin/tenants", label: "Organizações", icon: Building2 },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/usuarios", label: "Superadmins", icon: Users },
  { to: "/admin/onboarding", label: "Onboarding WhatsApp", icon: GitBranch },
  { to: "/admin/mensagens", label: "Mensagens operacionais", icon: FileText },
  { to: "/admin/simulador", label: "Simulador", icon: MessageCircle },
  { to: "/admin/configuracao", label: "Configuração", icon: Settings },
  { to: "/admin/assinatura", label: "Assinatura e-mail", icon: Mail },
];

function isNavItemVisible(item: NavItem, hasFeature: (key: string) => boolean, isAdmin: boolean): boolean {
  if (item.adminOnly && !isAdmin) return false;
  if (item.feature && !hasFeature(item.feature)) return false;
  if (item.children?.length) {
    return item.children.some((child) => isNavItemVisible(child, hasFeature, isAdmin));
  }
  return true;
}

function NavLinkItem({
  to,
  label,
  icon: Icon,
  end,
  onNavigate,
  collapsed,
  indent,
  sectionTitle,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  indent?: boolean;
  sectionTitle?: string;
}) {
  return (
    <SidebarCollapsedFlyout
      collapsed={collapsed}
      label={label}
      description={collapsed ? sectionTitle : undefined}
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
            !collapsed && indent && "ml-4 py-2 text-[13px]",
            isActive
              ? "bg-white/20 text-primary-foreground"
              : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
          )
        }
      >
        {collapsed && <Icon className="size-4 shrink-0" />}
        {!collapsed && label}
      </NavLink>
    </SidebarCollapsedFlyout>
  );
}

function NavGroup({
  item,
  hasFeature,
  isAdmin,
  onNavigate,
  collapsed,
  sectionTitle,
  pathname,
}: {
  item: NavItem;
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  sectionTitle: string;
  pathname: string;
}) {
  const visibleChildren = (item.children ?? []).filter((child) => isNavItemVisible(child, hasFeature, isAdmin));
  const Icon = item.icon;
  const isGroupActive = visibleChildren.some(
    (child) => child.to && (pathname === child.to || pathname.startsWith(`${child.to}/`)),
  );
  const [open, setOpen] = useState(false);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (isGroupActive && !wasActiveRef.current) setOpen(true);
    if (!isGroupActive && wasActiveRef.current) setOpen(false);
    wasActiveRef.current = isGroupActive;
  }, [isGroupActive]);

  if (collapsed) {
    const firstChild = visibleChildren.find((child) => child.to);
    const flyoutHint = visibleChildren.map((child) => child.label).join(" · ");

    return firstChild?.to ? (
      <SidebarCollapsedFlyout
        collapsed
        label={item.label}
        description={flyoutHint || sectionTitle}
      >
        <NavLink
          to={firstChild.to}
          onClick={onNavigate}
          data-tour={tourNavId(firstChild.to)}
          className={({ isActive }) =>
            cn(
              "flex items-center justify-center rounded-lg px-2 py-2.5 transition-colors",
              (isActive || isGroupActive) && "bg-white/20 text-primary-foreground",
              !isActive && !isGroupActive && "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
            )
          }
        >
          <Icon className="size-4 shrink-0" />
        </NavLink>
      </SidebarCollapsedFlyout>
    ) : null;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isGroupActive
            ? "text-primary-foreground"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
        )}
      >
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open &&
        visibleChildren.map((child) =>
          child.to ? (
            <NavLinkItem
              key={child.to}
              to={child.to}
              label={child.label}
              icon={child.icon}
              end={child.end}
              onNavigate={onNavigate}
              collapsed={collapsed}
              indent
              sectionTitle={item.label}
            />
          ) : null,
        )}
    </div>
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
  const { pathname } = useLocation();
  const visible = items.filter((item) => isNavItemVisible(item, hasFeature, isAdmin));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1" data-tour="sidebar-nav">
      {!collapsed && (
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/55">
          {title}
        </p>
      )}
      {visible.map((item) =>
        item.children?.length ? (
          <NavGroup
            key={item.label}
            item={item}
            hasFeature={hasFeature}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
            collapsed={collapsed}
            sectionTitle={title}
            pathname={pathname}
          />
        ) : item.to ? (
          <NavLinkItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            end={item.end}
            onNavigate={onNavigate}
            collapsed={collapsed}
            sectionTitle={title}
          />
        ) : null,
      )}
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
          <NavSection
            title="Operação"
            items={TENANT_NAV}
            hasFeature={hasFeature}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
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
                  ? `${email} · ${isPlatform ? "Superadmin" : role ?? "Operação"}`
                  : isPlatform
                    ? "Superadmin"
                    : (role ?? "Operação")
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
                  {isPlatform ? "Superadmin" : role ?? "Operação"}
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
