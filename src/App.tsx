import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { GuestRoute, ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HomePage, RequirePlatform, RequireTenant } from "@/components/layout/RouteGuards";

function lazyPage(
  loader: () => Promise<Record<string, ComponentType<unknown>>>,
  name: string,
) {
  return lazy(() => loader().then((module) => ({ default: module[name] as ComponentType<unknown> })));
}

const GuidePage = lazyPage(() => import("@/pages/GuidePage"), "GuidePage");
const JourneyPage = lazyPage(() => import("@/pages/JourneyPage"), "JourneyPage");
const WhatsappPage = lazyPage(() => import("@/pages/WhatsappPage"), "WhatsappPage");
const LoginPage = lazyPage(() => import("@/pages/LoginPage"), "LoginPage");
const PatientDetailPage = lazyPage(() => import("@/pages/PatientDetailPage"), "PatientDetailPage");
const PatientsPage = lazyPage(() => import("@/pages/PatientsPage"), "PatientsPage");
const ProfilePage = lazyPage(() => import("@/pages/ProfilePage"), "ProfilePage");
const ReportsPage = lazyPage(() => import("@/pages/ReportsPage"), "ReportsPage");
const SettingsPage = lazyPage(() => import("@/pages/SettingsPage"), "SettingsPage");
const SignupPage = lazyPage(() => import("@/pages/SignupPage"), "SignupPage");
const TemplatesPage = lazyPage(() => import("@/pages/TemplatesPage"), "TemplatesPage");
const ResetPasswordPage = lazyPage(() => import("@/pages/ResetPasswordPage"), "ResetPasswordPage");
const AdminEmailSignaturePage = lazy(() =>
  import("@/pages/admin/AdminEmailSignaturePage").then((m) => ({
    default: m.AdminEmailSignaturePage,
  })),
);
const AdminSimulatorPage = lazyPage(() => import("@/pages/admin/AdminSimulatorPage"), "AdminSimulatorPage");
const AdminFeaturesPage = lazyPage(() => import("@/pages/admin/AdminFeaturesPage"), "AdminFeaturesPage");
const AdminPlanFeaturesPage = lazyPage(
  () => import("@/pages/admin/AdminPlanFeaturesPage"),
  "AdminPlanFeaturesPage",
);
const AdminPlansPage = lazyPage(() => import("@/pages/admin/AdminPlansPage"), "AdminPlansPage");
const AdminPlatformUsersPage = lazyPage(
  () => import("@/pages/admin/AdminPlatformUsersPage"),
  "AdminPlatformUsersPage",
);
const AdminOnboardingPage = lazyPage(() => import("@/pages/admin/AdminOnboardingPage"), "AdminOnboardingPage");
const AdminTemplatesPage = lazyPage(() => import("@/pages/admin/AdminTemplatesPage"), "AdminTemplatesPage");
const AdminTenantsPage = lazyPage(() => import("@/pages/admin/AdminTenantsPage"), "AdminTenantsPage");
const AdminReportsPage = lazyPage(() => import("@/pages/admin/AdminReportsPage"), "AdminReportsPage");

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Carregando…
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<SignupPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="guia" element={<GuidePage />} />
                  <Route path="perfil" element={<ProfilePage />} />

                  <Route element={<RequireTenant />}>
                    <Route path="pacientes" element={<PatientsPage />} />
                    <Route path="pacientes/:id" element={<PatientDetailPage />} />
                    <Route path="relatorios" element={<ReportsPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="jornada" element={<JourneyPage />} />
                    <Route path="whatsapp" element={<WhatsappPage />} />
                    <Route path="configuracoes" element={<SettingsPage />} />
                  </Route>

                  <Route element={<RequirePlatform />}>
                    <Route path="admin" element={<Navigate to="/" replace />} />
                    <Route path="admin/planos" element={<AdminPlansPage />} />
                    <Route path="admin/planos/:planId" element={<AdminPlanFeaturesPage />} />
                    <Route path="admin/tenants" element={<AdminTenantsPage />} />
                    <Route path="admin/relatorios" element={<AdminReportsPage />} />
                    <Route path="admin/features" element={<AdminFeaturesPage />} />
                    <Route path="admin/usuarios" element={<AdminPlatformUsersPage />} />
                    <Route path="admin/assinatura" element={<AdminEmailSignaturePage />} />
                    <Route path="admin/simulador" element={<AdminSimulatorPage />} />
                    <Route path="admin/onboarding" element={<AdminOnboardingPage />} />
                    <Route path="admin/mensagens" element={<AdminTemplatesPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
