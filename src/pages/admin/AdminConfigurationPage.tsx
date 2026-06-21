import { AdminPlatformAiCard } from "@/components/admin/AdminPlatformAiCard";
import { PageHeader } from "@/components/PageHeader";

export function AdminConfigurationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração da plataforma"
        description="Preferências globais da Kokoro — provedores de IA, chaves e roteamento por funcionalidade."
      />

      <AdminPlatformAiCard />
    </div>
  );
}
