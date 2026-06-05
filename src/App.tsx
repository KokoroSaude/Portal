import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { GuestRoute, ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { HomePage, RequirePlatform, RequireTenant } from "@/components/layout/RouteGuards";
import { JourneyPage } from "@/pages/JourneyPage";
import { WhatsappPage } from "@/pages/WhatsappPage";
import { LoginPage } from "@/pages/LoginPage";
import { PatientDetailPage } from "@/pages/PatientDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SignupPage } from "@/pages/SignupPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { AdminEmailSignaturePage } from "@/pages/admin/AdminEmailSignaturePage";
import { AdminFeaturesPage } from "@/pages/admin/AdminFeaturesPage";
import { AdminPlanFeaturesPage } from "@/pages/admin/AdminPlanFeaturesPage";
import { AdminPlansPage } from "@/pages/admin/AdminPlansPage";
import { AdminPlatformUsersPage } from "@/pages/admin/AdminPlatformUsersPage";
import { AdminTenantsPage } from "@/pages/admin/AdminTenantsPage";

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
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<SignupPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />

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
                  <Route path="admin/features" element={<AdminFeaturesPage />} />
                  <Route path="admin/usuarios" element={<AdminPlatformUsersPage />} />
                  <Route path="admin/assinatura" element={<AdminEmailSignaturePage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
