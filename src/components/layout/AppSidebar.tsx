import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  GitBranch,
  GitCompare,
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Trash2,
  Megaphone,
  Monitor,
  PanelLeft,
  PanelLeftClose,
  Pill,
  ScrollText,
  Send,
  Settings,
  Shield,
  Sparkles,
  Star,
  Users,
  ListOrdered,
  Volume2,
} from "lucide-react";
import { KokoroLogo } from "@/components/KokoroLogo";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { SidebarCollapsedFlyout } from "@/components/layout/SidebarCollapsedFlyout";
import { SidebarSubmenuFlyout } from "@/components/layout/SidebarSubmenuFlyout";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FEATURE_KEYS } from "@/lib/constants";
import { DOCS_URL } from "@/lib/auth-redirect";
import { loadAuth, setAuthCookie } from "@/lib/api";
import { APP_VERSION } from "@/lib/version";
import { tourNavId } from "@/lib/tours";
import { isNavToActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useSidebarScrollDebug } from "@/hooks/useSidebarScrollDebug";

export type NavItem = {
  to?: string;
  href?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  feature?: string;
  adminOnly?: boolean;
  pickupNav?: boolean;
  children?: NavItem[];
};

export type NavSectionConfig = {
  title: string;
  items: NavItem[];
  pickupSection?: boolean;
};

export const TENANT_NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: "Dia a dia",
    items: [
      {
        to: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
        feature: FEATURE_KEYS.reportsBasic,
      },
      { to: "/pacientes", label: "Pacientes", icon: Users },
      {
        label: "WhatsApp",
        icon: MessageCircle,
        children: [
          {
            to: "/whatsapp/promocoes",
            label: "Promoções",
            icon: Megaphone,
            feature: FEATURE_KEYS.whatsappConversations,
          },
          {
            to: "/whatsapp/configuracao",
            label: "Configuração",
            icon: Settings,
          },
        ],
      },
    ],
  },
  {
    title: "Farmácia",
    pickupSection: true,
    items: [
      { to: "/farmacia", label: "Painel", icon: LayoutDashboard, pickupNav: true },
      { to: "/farmacia/retiradas", label: "Retiradas", icon: ListOrdered, pickupNav: true },
      { to: "/farmacia/fila-cronica", label: "Fila crônica", icon: ClipboardList, pickupNav: true },
      {
        to: "/farmacia/relatorios",
        label: "Relatórios",
        icon: BarChart3,
        pickupNav: true,
        feature: FEATURE_KEYS.reportsBasic,
      },
      { to: "/farmacia/tv", label: "Painel TV", icon: Monitor, pickupNav: true },
      { to: "/configuracoes/retirada", label: "Config. retirada", icon: Settings, pickupNav: true },
    ],
  },
  {
    title: "Análise",
    items: [
      {
        label: "Relatórios",
        icon: BarChart3,
        children: [
          {
            to: "/relatorios",
            label: "Visão geral",
            icon: BarChart3,
            end: true,
            feature: FEATURE_KEYS.reportsBasic,
          },
          {
            to: "/relatorios/adesao",
            label: "Adesão",
            icon: Activity,
            feature: FEATURE_KEYS.reportsBasic,
          },
          {
            to: "/relatorios/engajamento",
            label: "Engajamento",
            icon: MessageSquare,
            feature: FEATURE_KEYS.reportsAdvanced,
          },
          {
            to: "/relatorios/conversacional",
            label: "Conversacional",
            icon: MessageCircle,
            feature: FEATURE_KEYS.reportsConversationQuality,
          },
          {
            to: "/relatorios/operacao",
            label: "Operação",
            icon: Send,
            feature: FEATURE_KEYS.reportsOperations,
          },
          {
            to: "/relatorios/escalas",
            label: "Escalas",
            icon: ClipboardList,
            feature: FEATURE_KEYS.scalesMorisky,
          },
          {
            to: "/relatorios/programa-medicamento",
            label: "Por medicamento",
            icon: Pill,
            feature: FEATURE_KEYS.reportsCohort,
          },
        ],
      },
      {
        to: "/programas",
        label: "Programas terapêuticos",
        icon: ClipboardList,
        feature: FEATURE_KEYS.reportsCohort,
      },
    ],
  },
  {
    title: "Programa",
    items: [
      {
        to: "/jornada",
        label: "Jornada",
        icon: GitBranch,
        feature: FEATURE_KEYS.journeyOnboardingRead,
      },
      {
        to: "/templates",
        label: "Templates",
        icon: FileText,
        feature: FEATURE_KEYS.templatesCustomRead,
      },
      {
        to: "/conhecimento",
        label: "Base de conhecimento",
        icon: BookOpen,
        feature: FEATURE_KEYS.aiCopilot,
        adminOnly: true,
      },
    ],
  },
  {
    title: "Configuração",
    items: [
      {
        label: "Configurações",
        icon: Settings,
        adminOnly: true,
        children: [
          { to: "/configuracoes?tab=operacao", label: "Operação", icon: Settings },
          { to: "/configuracoes?tab=engajamento", label: "Engajamento", icon: Megaphone },
          { to: "/configuracoes?tab=onboarding", label: "Onboarding", icon: GitBranch },
          { to: "/configuracoes?tab=pesquisas", label: "Pesquisas", icon: Star },
          {
            to: "/configuracoes/usuarios",
            label: "Usuários",
            icon: Users,
            feature: FEATURE_KEYS.usersManage,
          },
        ],
      },
      {
        label: "IA",
        icon: Sparkles,
        adminOnly: true,
        children: [
          { to: "/configuracoes/ia/geral", label: "Geral", icon: Sparkles },
          { to: "/configuracoes/ia/mensagens", label: "Lembretes e marcos", icon: Send },
          { to: "/configuracoes/ia/conversacao/modos", label: "Modos inbound", icon: MessageCircle },
          { to: "/configuracoes/ia/conversacao/handoff", label: "Handoff e timing", icon: Clock },
          { to: "/configuracoes/ia/conversacao/automacao", label: "Automação", icon: Activity },
          { to: "/configuracoes/simulador", label: "Simulador", icon: GitBranch },
        ],
      },
      {
        to: "/medicamentos",
        label: "Catálogo de medicamentos",
        icon: Pill,
        adminOnly: true,
      },
      {
        to: "/morisky",
        label: "MMAS-8 (Morisky)",
        icon: ClipboardList,
        adminOnly: true,
        feature: FEATURE_KEYS.scalesMorisky,
      },
      {
        to: "/tcp",
        label: "TCP (Comportamento)",
        icon: ClipboardList,
        adminOnly: true,
        feature: FEATURE_KEYS.scalesTpb,
      },
    ],
  },
  {
    title: "Ajuda",
    items: [
      { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
      { href: DOCS_URL, label: "Documentação", icon: BookOpen },
    ],
  },
];

/** Flat list derived from sections (legacy). */
export const TENANT_NAV: NavItem[] = TENANT_NAV_SECTIONS.flatMap((section) => section.items);

export const PLATFORM_NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: "Gestão",
    items: [
      { to: "/", label: "Visão geral", icon: Shield, end: true },
      { to: "/admin/tenants", label: "Organizações", icon: Building2 },
      { to: "/admin/tenants/excluidas", label: "Organizações excluídas", icon: Trash2 },
      {
        label: "Relatórios",
        icon: BarChart3,
        children: [
          { to: "/admin/relatorios", label: "Visão geral", icon: BarChart3, end: true },
          { to: "/admin/relatorios/adesao", label: "Adesão", icon: Activity },
          { to: "/admin/relatorios/engajamento", label: "Engajamento", icon: MessageSquare },
          { to: "/admin/relatorios/operacao", label: "Operação", icon: Send },
          { to: "/admin/relatorios/escalas", label: "Escalas", icon: ClipboardList },
          { to: "/admin/relatorios/rastreabilidade", label: "Rastreabilidade", icon: ScrollText },
          { to: "/admin/relatorios/remetentes", label: "Remetentes", icon: BarChart3 },
          { to: "/admin/relatorios/comparativo", label: "Comparativo", icon: GitCompare },
        ],
      },
      { to: "/admin/usuarios", label: "Superadmins", icon: Users },
    ],
  },
  {
    title: "WhatsApp",
    items: [
      { to: "/admin/onboarding", label: "Onboarding", icon: GitBranch },
      { to: "/admin/templates-meta", label: "Templates Meta", icon: MessageSquare },
      { to: "/admin/vozes", label: "Catálogo de vozes", icon: Volume2 },
      { to: "/admin/mensagens", label: "Mensagens operacionais", icon: FileText },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { to: "/admin/configuracao", label: "Configuração da plataforma", icon: Settings },
      { to: "/admin/assinatura", label: "Assinatura de e-mail", icon: Mail },
    ],
  },
  {
    title: "Ajuda",
    items: [
      { to: "/guia", label: "Guia passo a passo", icon: HelpCircle },
      { href: DOCS_URL, label: "Documentação", icon: BookOpen },
    ],
  },
];

export const PLATFORM_NAV: NavItem[] = PLATFORM_NAV_SECTIONS.flatMap((section) => section.items);

function isNavItemVisible(
  item: NavItem,
  hasFeature: (key: string) => boolean,
  isAdmin: boolean,
  pickupAccess: boolean,
): boolean {
  if (item.pickupNav && !pickupAccess) return false;
  if (item.adminOnly && !isAdmin) return false;
  if (item.feature && !hasFeature(item.feature)) return false;
  if (item.children?.length) {
    return item.children.some((child) =>
      isNavItemVisible(child, hasFeature, isAdmin, pickupAccess),
    );
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
  const { pathname, search } = useLocation();

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
        data-tour={tourNavId(to.split("?")[0] ?? to)}
        className={() =>
          cn(
            "flex items-start rounded-lg py-2 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
            !collapsed && indent && "ml-3 py-2 pl-3 text-[13px] font-normal",
            isNavToActive(to, pathname, search)
              ? "bg-white/20 text-primary-foreground"
              : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
          )
        }
      >
        <Icon className={cn("mt-0.5 shrink-0", collapsed ? "size-4" : "size-4 opacity-90")} />
        {!collapsed && (
          <span className="min-w-0 flex-1 line-clamp-2 leading-snug" title={label}>
            {label}
          </span>
        )}
      </NavLink>
    </SidebarCollapsedFlyout>
  );
}

function NavExternalLinkItem({
  href,
  label,
  icon: Icon,
  onNavigate,
  collapsed,
  sectionTitle,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
  collapsed?: boolean;
  sectionTitle?: string;
}) {
  function handleClick() {
    const auth = loadAuth();
    if (auth?.token) {
      const secondsLeft = Math.floor((auth.expiresAt - Date.now()) / 1000);
      if (secondsLeft > 0) setAuthCookie(auth.token, secondsLeft);
    }
    onNavigate?.();
  }

  return (
    <SidebarCollapsedFlyout
      collapsed={collapsed}
      label={label}
      description={collapsed ? sectionTitle : undefined}
    >
      <a
        href={href}
        onClick={handleClick}
        className={cn(
          "flex items-start rounded-lg py-2 text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
        )}
      >
        <Icon className={cn("mt-0.5 shrink-0", collapsed ? "size-4" : "size-4 opacity-90")} />
        {!collapsed && (
          <span className="min-w-0 flex-1 line-clamp-2 leading-snug" title={label}>
            {label}
          </span>
        )}
      </a>
    </SidebarCollapsedFlyout>
  );
}

function NavGroup({
  item,
  hasFeature,
  isAdmin,
  pickupAccess,
  onNavigate,
  collapsed,
  pathname,
}: {
  item: NavItem;
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  pickupAccess?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  pathname: string;
}) {
  const pickup = pickupAccess === true;
  const visibleChildren = (item.children ?? []).filter((child) =>
    isNavItemVisible(child, hasFeature, isAdmin, pickup),
  );
  const Icon = item.icon;
  const isGroupActive = visibleChildren.some((child) => {
    if (!child.to) return false;
    const path = child.to.split("?")[0] ?? child.to;
    if (path === "/configuracoes") return pathname === "/configuracoes";
    if (path.startsWith("/configuracoes/ia")) {
      return pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith("/configuracoes/ia/");
    }
    return pathname === child.to || pathname.startsWith(`${path}/`);
  });
  const [open, setOpen] = useState(isGroupActive);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (isGroupActive && !wasActiveRef.current) setOpen(true);
    wasActiveRef.current = isGroupActive;
  }, [isGroupActive]);

  if (collapsed) {
    const flyoutItems = visibleChildren
      .filter((child): child is NavItem & { to: string } => !!child.to)
      .map((child) => ({ to: child.to, label: child.label }));

    return (
      <SidebarSubmenuFlyout
        label={item.label}
        items={flyoutItems}
        onNavigate={onNavigate}
        trigger={
          <div
            className={cn(
              "flex items-center justify-center rounded-lg px-2 py-2.5 transition-colors",
              isGroupActive
                ? "bg-white/20 text-primary-foreground"
                : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
            )}
            aria-label={item.label}
          >
            <Icon className="size-4 shrink-0" />
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isGroupActive
            ? "bg-white/10 text-primary-foreground"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0 opacity-90" />
        <span className="min-w-0 flex-1 line-clamp-2 text-left leading-snug" title={item.label}>
          {item.label}
        </span>
        <ChevronDown
          className={cn("mt-0.5 size-4 shrink-0 opacity-70 transition-transform", open && "rotate-180")}
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
  pickupAccess,
  onNavigate,
  collapsed,
  hideSection,
}: {
  title: string;
  items: NavItem[];
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  pickupAccess?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  hideSection?: boolean;
}) {
  const { pathname } = useLocation();
  if (hideSection) return null;
  const pickup = pickupAccess === true;
  const visible = items.filter((item) =>
    isNavItemVisible(item, hasFeature, isAdmin, pickup),
  );
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1" data-tour={title === "Dia a dia" ? "sidebar-nav" : undefined}>
      {!collapsed && (
        <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/55 first:pt-0">
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
            pickupAccess={pickup}
            onNavigate={onNavigate}
            collapsed={collapsed}
            pathname={pathname}
          />
        ) : item.href ? (
          <NavExternalLinkItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onNavigate={onNavigate}
            collapsed={collapsed}
            sectionTitle={title}
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

  const { pickupAccess } = useTenantSettings();

  const email = auth?.user?.email ?? auth?.platformUser?.email;

  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useSidebarScrollDebug(
    { root: rootRef, grid: shellRef, header: headerRef, nav: navRef, footer: footerRef },
    collapsed,
  );

  const handleLogout = () => {
    onNavigate?.();
    logout();
    onLogout?.();
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-primary via-primary to-[#E85F5F] text-primary-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5" />
      </div>

      <div
        ref={shellRef}
        className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden"
      >
        <header
          ref={headerRef}
          className={cn(
            "shrink-0 bg-gradient-to-br from-primary via-primary to-[#E85F5F]",
            collapsed ? "px-2 py-4" : "px-3 py-4",
          )}
        >
          {!collapsed ? (
            <>
              <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-1">
                <div className="size-8" aria-hidden />
                <KokoroLogo variant="onCoral" to="/" height={48} className="mx-auto" />
                {collapsible ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
                    aria-label="Recolher menu"
                    onClick={onToggleCollapsed}
                  >
                    <PanelLeftClose className="size-4" />
                  </Button>
                ) : (
                  <div className="size-8" aria-hidden />
                )}
              </div>
              <p className="mt-2 text-center text-xs text-primary-foreground/70">Portal</p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <KokoroLogo variant="onCoral" to="/" height={32} />
              {collapsible && (
                <SidebarCollapsedFlyout collapsed label="Expandir menu">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
                    aria-label="Expandir menu"
                    onClick={onToggleCollapsed}
                  >
                    <PanelLeft className="size-4" />
                  </Button>
                </SidebarCollapsedFlyout>
              )}
            </div>
          )}
          <Separator className="mt-4 bg-white/20" />
        </header>

        <nav
          ref={navRef}
          data-sidebar-nav
          className={cn(
            "sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden",
            collapsed ? "sidebar-scroll--collapsed p-2 py-3" : "sidebar-scroll--expanded px-4 py-3",
          )}
        >
          <div className="flex flex-col gap-1.5">
            {isTenant &&
              TENANT_NAV_SECTIONS.map((section) => (
                <NavSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  hasFeature={hasFeature}
                  isAdmin={isAdmin}
                  pickupAccess={pickupAccess}
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                  hideSection={section.pickupSection && !pickupAccess}
                />
              ))}
            {isPlatform &&
              PLATFORM_NAV_SECTIONS.map((section) => (
                <NavSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  hasFeature={() => true}
                  isAdmin
                  onNavigate={onNavigate}
                  collapsed={collapsed}
                />
              ))}
          </div>
        </nav>

        <footer
          ref={footerRef}
          className={cn(
            "shrink-0 border-t border-white/20 bg-gradient-to-br from-primary via-primary to-[#E85F5F]",
            collapsed ? "p-2" : "p-4",
          )}
        >
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
                <div className="flex items-center justify-center gap-1">
                  <PwaInstallButton variant="sidebar" collapsed />
                  <ThemeToggle collapsed />
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
                <div className="flex items-center justify-center gap-1">
                  <PwaInstallButton variant="sidebar" iconOnly />
                  <ThemeToggle iconOnly />
                  <SidebarCollapsedFlyout forceTooltip placement="top" label="Sair">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
                      aria-label="Sair"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </SidebarCollapsedFlyout>
                </div>
                <p className="mt-3 text-center text-[10px] text-primary-foreground/50">v{APP_VERSION}</p>
              </>
            )}
        </footer>
      </div>
    </div>
  );
}
