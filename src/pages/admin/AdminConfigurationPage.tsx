import { AdminPlatformAiCard } from "@/components/admin/AdminPlatformAiCard";
import { PageHeader } from "@/components/PageHeader";

export function AdminConfigurationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Configuração"
        description="Preferências globais da plataforma Kokoro"
      />

      <AdminPlatformAiCard />
    </div>
  );
}
