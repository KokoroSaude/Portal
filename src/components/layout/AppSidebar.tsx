import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  GitBranch,
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Megaphone,
  PanelLeft,
  PanelLeftClose,
  Pill,
  Settings,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import { KokoroLogo } from "@/components/KokoroLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { SidebarCollapsedFlyout } from "@/components/layout/SidebarCollapsedFlyout";
import { SidebarSubmenuFlyout } from "@/components/layout/SidebarSubmenuFlyout";
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

export type NavSectionConfig = {
  title: string;
  items: NavItem[];
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
            to: "/whatsapp/conversas",
            label: "Conversas",
            icon: MessageCircle,
            feature: FEATURE_KEYS.whatsappConversations,
          },
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
            feature: FEATURE_KEYS.reportsBasic,
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
      { to: "/configuracoes", label: "Geral", icon: Settings },
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
    items: [{ to: "/guia", label: "Guia passo a passo", icon: HelpCircle }],
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
      { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/admin/usuarios", label: "Superadmins", icon: Users },
    ],
  },
  {
    title: "WhatsApp",
    items: [
      { to: "/admin/onboarding", label: "Onboarding", icon: GitBranch },
      { to: "/admin/templates-meta", label: "Templates Meta", icon: MessageSquare },
      { to: "/admin/mensagens", label: "Mensagens operacionais", icon: FileText },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { to: "/admin/simulador", label: "Simulador", icon: Wrench },
      { to: "/admin/configuracao", label: "Configuração da plataforma", icon: Settings },
      { to: "/admin/assinatura", label: "Assinatura de e-mail", icon: Mail },
    ],
  },
  {
    title: "Ajuda",
    items: [{ to: "/guia", label: "Guia passo a passo", icon: HelpCircle }],
  },
];

export const PLATFORM_NAV: NavItem[] = PLATFORM_NAV_SECTIONS.flatMap((section) => section.items);

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
            !collapsed && indent && "ml-3 py-2 pl-3 text-[13px] font-normal",
            isActive
              ? "bg-white/20 text-primary-foreground"
              : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
          )
        }
      >
        <Icon className={cn("shrink-0", collapsed ? "size-4" : "size-4 opacity-90")} />
        {!collapsed && <span className="truncate">{label}</span>}
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
  pathname,
}: {
  item: NavItem;
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  pathname: string;
}) {
  const visibleChildren = (item.children ?? []).filter((child) => isNavItemVisible(child, hasFeature, isAdmin));
  const Icon = item.icon;
  const isGroupActive = visibleChildren.some(
    (child) => child.to && (pathname === child.to || pathname.startsWith(`${child.to}/`)),
  );
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
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isGroupActive
            ? "bg-white/10 text-primary-foreground"
            : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
        )}
      >
        <Icon className="size-4 shrink-0 opacity-90" />
        <span className="flex-1 truncate text-left">{item.label}</span>
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
            onNavigate={onNavigate}
            collapsed={collapsed}
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

function useSidebarNavMaxHeight(
  rootRef: React.RefObject<HTMLElement | null>,
  headerRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  const [maxHeight, setMaxHeight] = useState<number>();

  useLayoutEffect(() => {
    const measure = () => {
      const viewport = rootRef.current?.clientHeight ?? window.innerHeight;
      const header = headerRef.current?.offsetHeight ?? 0;
      const footer = footerRef.current?.offsetHeight ?? 0;
      setMaxHeight(Math.max(96, viewport - header - footer - 1));
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (rootRef.current) observer.observe(rootRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    if (footerRef.current) observer.observe(footerRef.current);

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when sidebar chrome changes
  }, deps);

  return maxHeight;
}

function stopMainScrollWhenNavScrolls(nav: HTMLElement, event: WheelEvent) {
  if (nav.scrollHeight <= nav.clientHeight + 1) return;

  const atTop = nav.scrollTop <= 0;
  const atBottom = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1;

  if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) {
    event.stopPropagation();
  }
}

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

  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const navMaxHeight = useSidebarNavMaxHeight(rootRef, headerRef, footerRef, [
    collapsed,
    displayName,
    email,
    isPlatform,
    isTenant,
    isAdmin,
    role,
  ]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onWheel = (event: WheelEvent) => stopMainScrollWhenNavScrolls(nav, event);
    nav.addEventListener("wheel", onWheel);
    return () => nav.removeEventListener("wheel", onWheel);
  }, [navMaxHeight]);

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
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-72 rounded-full bg-white/5" aria-hidden />

      <div
        ref={headerRef}
        className={cn(
          "relative z-10 flex shrink-0 flex-col items-center text-center",
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

      <Separator className="relative z-10 shrink-0 bg-white/20" />

      <nav
        ref={navRef}
        style={navMaxHeight ? { maxHeight: navMaxHeight } : undefined}
        className={cn(
          "relative z-10 shrink-0 overflow-x-hidden overflow-y-auto overscroll-y-contain",
          "[scrollbar-gutter:stable]",
          collapsed ? "p-2" : "p-4",
        )}
      >
        <div className="flex flex-col gap-2">
          {isTenant &&
            TENANT_NAV_SECTIONS.map((section) => (
              <NavSection
                key={section.title}
                title={section.title}
                items={section.items}
                hasFeature={hasFeature}
                isAdmin={isAdmin}
                onNavigate={onNavigate}
                collapsed={collapsed}
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

      <div
        ref={footerRef}
        className={cn(
          "relative z-10 mt-auto shrink-0 border-t border-white/20",
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
