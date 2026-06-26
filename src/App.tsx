import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthQuerySync } from "@/components/AuthQuerySync";
import { AppLayout } from "@/components/layout/AppLayout";
import { GuestRoute, ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HomePage, RequireGovPharmacy, RequirePlatform, RequireTenant } from "@/components/layout/RouteGuards";

function lazyPage(
  loader: () => Promise<Record<string, ComponentType<unknown>>>,
  name: string,
) {
  return lazy(() => loader().then((module) => ({ default: module[name] as ComponentType<unknown> })));
}

const GuidePage = lazyPage(() => import("@/pages/GuidePage"), "GuidePage");
const JourneyPage = lazyPage(() => import("@/pages/JourneyPage"), "JourneyPage");
const WhatsappConversationsPage = lazyPage(
  () => import("@/pages/WhatsappConversationsPage"),
  "WhatsappConversationsPage",
);
const PromoCampaignsPage = lazyPage(
  () => import("@/pages/PromoCampaignsPage"),
  "PromoCampaignsPage",
);
const WhatsappConfigPage = lazyPage(() => import("@/pages/WhatsappConfigPage"), "WhatsappConfigPage");
const LoginPage = lazyPage(() => import("@/pages/LoginPage"), "LoginPage");
const PatientDetailPage = lazyPage(() => import("@/pages/PatientDetailPage"), "PatientDetailPage");
const PatientsPage = lazyPage(() => import("@/pages/PatientsPage"), "PatientsPage");
const ProfilePage = lazyPage(() => import("@/pages/ProfilePage"), "ProfilePage");
const ReportsPage = lazyPage(() => import("@/pages/ReportsPage"), "ReportsPage");
const MedicationProgramPage = lazyPage(
  () => import("@/pages/MedicationProgramPage"),
  "MedicationProgramPage",
);
const MedicationProgramsPage = lazyPage(
  () => import("@/pages/MedicationProgramsPage"),
  "MedicationProgramsPage",
);
const MedicationsPage = lazyPage(() => import("@/pages/MedicationsPage"), "MedicationsPage");
const SettingsPage = lazyPage(() => import("@/pages/SettingsPage"), "SettingsPage");
const MoriskySettingsPage = lazyPage(
  () => import("@/pages/MoriskySettingsPage"),
  "MoriskySettingsPage",
);
const TpbSettingsPage = lazyPage(
  () => import("@/pages/TpbSettingsPage"),
  "TpbSettingsPage",
);
const TemplatesPage = lazyPage(() => import("@/pages/TemplatesPage"), "TemplatesPage");
const KnowledgePage = lazyPage(() => import("@/pages/KnowledgePage"), "KnowledgePage");
const ResetPasswordPage = lazyPage(() => import("@/pages/ResetPasswordPage"), "ResetPasswordPage");
const AdminEmailSignaturePage = lazy(() =>
  import("@/pages/admin/AdminEmailSignaturePage").then((m) => ({
    default: m.AdminEmailSignaturePage,
  })),
);
const AdminSimulatorPage = lazyPage(() => import("@/pages/admin/AdminSimulatorPage"), "AdminSimulatorPage");
const AdminPlatformUsersPage = lazyPage(
  () => import("@/pages/admin/AdminPlatformUsersPage"),
  "AdminPlatformUsersPage",
);
const AdminOnboardingPage = lazyPage(() => import("@/pages/admin/AdminOnboardingPage"), "AdminOnboardingPage");
const AdminTemplatesPage = lazyPage(() => import("@/pages/admin/AdminTemplatesPage"), "AdminTemplatesPage");
const AdminTenantsPage = lazyPage(() => import("@/pages/admin/AdminTenantsPage"), "AdminTenantsPage");
const AdminDeletedTenantsPage = lazyPage(
  () => import("@/pages/admin/AdminDeletedTenantsPage"),
  "AdminDeletedTenantsPage",
);
const AdminReportsPage = lazyPage(() => import("@/pages/admin/AdminReportsPage"), "AdminReportsPage");
const AdminConfigurationPage = lazyPage(
  () => import("@/pages/admin/AdminConfigurationPage"),
  "AdminConfigurationPage",
);
const AdminMetaTemplatesPage = lazyPage(
  () => import("@/pages/admin/AdminMetaTemplatesPage"),
  "AdminMetaTemplatesPage",
);
const AdminVoiceCatalogPage = lazyPage(
  () => import("@/pages/admin/AdminVoiceCatalogPage"),
  "AdminVoiceCatalogPage",
);
const FarmaciaDashboardPage = lazyPage(
  () => import("@/pages/farmacia/FarmaciaDashboardPage"),
  "FarmaciaDashboardPage",
);
const FarmaciaRetiradasPage = lazyPage(
  () => import("@/pages/farmacia/FarmaciaRetiradasPage"),
  "FarmaciaRetiradasPage",
);
const FarmaciaTvPage = lazyPage(
  () => import("@/pages/farmacia/FarmaciaTvPage"),
  "FarmaciaTvPage",
);
const FarmaciaRelatoriosPage = lazyPage(
  () => import("@/pages/farmacia/FarmaciaRelatoriosPage"),
  "FarmaciaRelatoriosPage",
);
const FarmaciaWaitlistPage = lazyPage(
  () => import("@/pages/farmacia/FarmaciaWaitlistPage"),
  "FarmaciaWaitlistPage",
);

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
        <AuthQuerySync />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<Navigate to="/login" replace />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              <Route path="/farmacia/tv" element={<FarmaciaTvPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="guia" element={<GuidePage />} />
                  <Route path="perfil" element={<ProfilePage />} />

                  <Route element={<RequireTenant />}>
                    <Route path="pacientes" element={<PatientsPage />} />
                    <Route path="pacientes/:id" element={<PatientDetailPage />} />
                    <Route path="relatorios" element={<ReportsPage />} />
                    <Route path="relatorios/programa-medicamento" element={<MedicationProgramPage />} />
                    <Route path="programas" element={<MedicationProgramsPage />} />
                    <Route path="medicamentos" element={<MedicationsPage />} />
                    <Route path="templates" element={<TemplatesPage />} />
                    <Route path="conhecimento" element={<KnowledgePage />} />
                    <Route path="jornada" element={<JourneyPage />} />
                    <Route path="whatsapp" element={<Navigate to="/whatsapp/conversas" replace />} />
                    <Route path="whatsapp/conversas" element={<WhatsappConversationsPage />} />
                    <Route path="whatsapp/promocoes" element={<PromoCampaignsPage />} />
                    <Route path="whatsapp/configuracao" element={<WhatsappConfigPage />} />
                    <Route path="morisky" element={<MoriskySettingsPage />} />
                    <Route path="tcp" element={<TpbSettingsPage />} />
                    <Route path="tpb" element={<Navigate to="/tcp" replace />} />
                    <Route path="configuracoes/morisky" element={<Navigate to="/morisky" replace />} />
                    <Route path="configuracoes" element={<SettingsPage />} />
                    <Route element={<RequireGovPharmacy />}>
                      <Route path="farmacia" element={<FarmaciaDashboardPage />} />
                      <Route path="farmacia/retiradas" element={<FarmaciaRetiradasPage />} />
                      <Route path="farmacia/relatorios" element={<FarmaciaRelatoriosPage />} />
                      <Route path="farmacia/fila-cronica" element={<FarmaciaWaitlistPage />} />
                    </Route>
                  </Route>

                  <Route element={<RequirePlatform />}>
                    <Route path="admin" element={<Navigate to="/" replace />} />
                    <Route path="admin/tenants" element={<AdminTenantsPage />} />
                    <Route path="admin/tenants/excluidas" element={<AdminDeletedTenantsPage />} />
                    <Route path="admin/relatorios" element={<AdminReportsPage />} />
                    <Route path="admin/usuarios" element={<AdminPlatformUsersPage />} />
                    <Route path="admin/assinatura" element={<AdminEmailSignaturePage />} />
                    <Route path="admin/simulador" element={<AdminSimulatorPage />} />
                    <Route path="admin/onboarding" element={<AdminOnboardingPage />} />
                    <Route path="admin/mensagens" element={<AdminTemplatesPage />} />
                    <Route path="admin/templates-meta" element={<AdminMetaTemplatesPage />} />
                    <Route path="admin/vozes" element={<AdminVoiceCatalogPage />} />
                    <Route path="admin/configuracao" element={<AdminConfigurationPage />} />
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
