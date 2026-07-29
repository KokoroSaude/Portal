import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

type PatientSubPageShellProps = {
  patientId: string | undefined;
  patientName?: string | null;
  patientLoading: boolean;
  notFound: boolean;
  title: string;
  description: string;
  locked?: boolean;
  lockedTitle?: string;
  lockedDescription?: string;
  /** Deep-link de volta à ficha (ex.: `/pacientes/:id?tab=escalas`). */
  backHref?: string;
  children: ReactNode;
};

export function PatientSubPageShell({
  patientId,
  patientName,
  patientLoading,
  notFound,
  title,
  description,
  locked,
  lockedTitle = "Recurso não disponível",
  lockedDescription = "Este recurso não está incluído no seu plano atual.",
  backHref,
  children,
}: PatientSubPageShellProps) {
  const patientHome = patientId
    ? backHref ?? `/pacientes/${patientId}`
    : "/pacientes";

  if (locked) {
    return (
      <>
        <Link
          to={patientHome}
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao paciente
        </Link>
        <PageHeader title={title} description={description} />
        <FeatureLocked title={lockedTitle} description={lockedDescription} />
      </>
    );
  }

  if (patientLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (notFound || !patientId) {
    return (
      <div className="space-y-4">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <p className="text-destructive">Paciente não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={patientHome}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {patientName ?? "Paciente"}
      </Link>

      <PageHeader title={title} description={description} />

      {children}
    </div>
  );
}
