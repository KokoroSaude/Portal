import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  FileText,
  GitBranch,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { KokoroLogo } from "@/components/KokoroLogo";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FEATURE_KEYS } from "@/lib/constants";
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
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, feature: FEATURE_KEYS.reportsBasic },
  { to: "/pacientes", label: "Pacientes", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, feature: FEATURE_KEYS.reportsBasic },
  { to: "/templates", label: "Templates", icon: FileText, feature: FEATURE_KEYS.templatesCustomRead },
  { to: "/jornada", label: "Jornada", icon: GitBranch, feature: FEATURE_KEYS.journeyOnboardingRead },
  { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export const PLATFORM_NAV: NavItem[] = [
  { to: "/", label: "Visão geral", icon: Shield, end: true },
  { to: "/admin/planos", label: "Planos", icon: Layers },
  { to: "/admin/tenants", label: "Tenants", icon: Building2 },
  { to: "/admin/features", label: "Features", icon: Shield },
  { to: "/admin/usuarios", label: "Superadmins", icon: Users },
  { to: "/admin/mensagens", label: "Mensagens padrão", icon: FileText },
  { to: "/admin/simulador", label: "Simulador", icon: MessageCircle },
  { to: "/admin/assinatura", label: "Assinatura e-mail", icon: Mail },
];

function NavSection({
  title,
  items,
  hasFeature,
  isAdmin,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  hasFeature: (key: string) => boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const visible = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.feature && !hasFeature(item.feature)) return false;
    return true;
  });
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/55">
        {title}
      </p>
      {visible.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/20 text-primary-foreground"
                : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </div>
  );
}

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  onLogout?: () => void;
};

export function AppSidebar({ className, onNavigate, onLogout }: AppSidebarProps) {
  const { displayName, logout, auth, hasFeature, isPlatform, isTenant, isAdmin, role } = useAuth();
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

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

      <div className="relative z-10 flex flex-col items-center px-6 py-5 text-center">
        <KokoroLogo variant="onCoral" to="/" height={56} />
        <p className="mt-2 text-xs text-primary-foreground/70">Portal</p>
      </div>

      <Separator className="relative z-10 bg-white/20" />

      <nav className="relative z-10 flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {isTenant && (
          <NavSection
            title="Operação"
            items={TENANT_NAV}
            hasFeature={hasFeature}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
          />
        )}
        {isPlatform && (
          <NavSection
            title="Plataforma"
            items={PLATFORM_NAV}
            hasFeature={() => true}
            isAdmin
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <div className="relative z-10 border-t border-white/20 p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-white/20 text-xs text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-primary-foreground/70">{email}</p>
            <Badge className="mt-1 border-white/30 bg-white/15 text-[10px] text-primary-foreground hover:bg-white/15">
              {isPlatform ? "Superadmin" : role ?? "Tenant"}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
