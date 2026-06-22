import { Link } from "react-router-dom";
import { FeatureLocked } from "@/components/PageHeader";

export function PickupFeatureLocked() {
  return (
    <FeatureLocked
      title="Retirada farmácia indisponível"
      description="Este módulo é exclusivo de organizações cadastradas como farmácia governamental (SUS). O tipo de organização é definido pelo administrador da plataforma."
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
