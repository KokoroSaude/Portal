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

export function AppLayout() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  const handleLogout = () => {
    closeMobileNav();
    navigate("/login");
  };

  return (
    <TourProvider onOpenMobileNav={() => setMobileNavOpen(true)}>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <aside className="hidden h-full w-64 shrink-0 lg:flex">
          <AppSidebar className="w-full shadow-sm" onLogout={handleLogout} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Abrir menu"
              aria-expanded={mobileNavOpen}
              data-tour="mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <KokoroLogo variant="mark" to="/" height={36} />
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
            className="h-full w-full"
            onNavigate={closeMobileNav}
            onLogout={handleLogout}
          />
        </MobileNavDrawer>

        <ProductTour />
      </div>
    </TourProvider>
  );
}
