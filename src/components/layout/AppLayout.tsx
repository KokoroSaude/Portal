import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { ProductTour } from "@/components/guide/ProductTour";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { KokoroLogo } from "@/components/KokoroLogo";
import { Button } from "@/components/ui/button";
import { TourProvider } from "@/contexts/TourContext";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapsed();

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleLogout = () => {
    closeMobileNav();
    navigate("/login");
  };

  return (
    <TourProvider onOpenMobileNav={() => setMobileNavOpen(true)}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <aside
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out lg:flex lg:h-[100dvh] lg:max-h-[100dvh] lg:flex-col",
            sidebarCollapsed ? "w-16" : "w-64",
          )}
        >
          <AppSidebar
            className="min-h-0 w-full flex-1 shadow-sm"
            collapsed={sidebarCollapsed}
            collapsible
            onToggleCollapsed={toggleSidebar}
            onLogout={handleLogout}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="relative flex h-14 shrink-0 items-center border-b border-border/60 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative z-10 shrink-0"
              aria-label="Abrir menu"
              aria-expanded={mobileNavOpen}
              data-tour="mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-14">
              <KokoroLogo variant="mark" to="/" height={32} className="pointer-events-auto" />
            </div>

            <div className="relative z-10 size-10 shrink-0" aria-hidden />
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-tour="main-content">
            <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:p-8">
              <ImpersonationBanner />
              <Outlet />
            </div>
          </main>
        </div>

        <MobileNavDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <AppSidebar
            className="min-h-0 h-full w-full"
            onNavigate={closeMobileNav}
            onLogout={handleLogout}
          />
        </MobileNavDrawer>

        <ProductTour />
      </div>
    </TourProvider>
  );
}
