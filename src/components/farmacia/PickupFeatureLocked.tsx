import { Link } from "react-router-dom";
import { FeatureLocked } from "@/components/PageHeader";

export function PickupFeatureLocked() {
  return (
    <FeatureLocked
      title="Módulo não habilitado"
      description="A retirada em farmácia não está ativa para sua organização. Peça ao administrador da plataforma para habilitar o módulo Retirada em farmácia."
    />
  );
}

export function PickupSettingsLink() {
  return (
    <Link to="/configuracoes?tab=operacao" className="text-sm text-primary hover:underline">
      Configurar retirada →
    </Link>
  );
}
