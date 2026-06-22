import { Link } from "react-router-dom";
import { FeatureLocked } from "@/components/PageHeader";

export function PickupFeatureLocked() {
  return (
    <FeatureLocked
      title="Retirada farmácia indisponível"
      description="Ative o modo farmácia governamental ou o recurso de retirada nas configurações da organização."
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
