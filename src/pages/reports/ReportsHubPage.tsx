import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ClipboardList, LineChart, MessageSquare, Pill, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { FEATURE_KEYS } from "@/lib/constants";

type ReportLink = {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
};

const REPORT_LINKS: ReportLink[] = [
  {
    to: "/relatorios/adesao",
    title: "Adesão",
    description: "Taxa de adesão, check-ins, tendências e barreiras comportamentais.",
    icon: BarChart3,
  },
  {
    to: "/relatorios/engajamento",
    title: "Engajamento",
    description: "Respostas no WhatsApp, nudges, funil de pacientes e comparativo de períodos.",
    icon: LineChart,
    feature: FEATURE_KEYS.reportsAdvanced,
  },
  {
    to: "/relatorios/conversacional",
    title: "Conversacional",
    description: "Scorecard de qualidade, retenção, funil de onboarding, handoffs e origem IA das mensagens.",
    icon: MessageSquare,
    feature: FEATURE_KEYS.reportsConversationQuality,
  },
  {
    to: "/relatorios/operacao",
    title: "Operação",
    description: "Lembretes, reengajamento e performance por remetente WhatsApp.",
    icon: Settings2,
    feature: FEATURE_KEYS.reportsOperations,
  },
  {
    to: "/relatorios/escalas",
    title: "Escalas",
    description: "Relatórios MMAS-8 (Morisky) e TCP (Teoria do Comportamento Planejado).",
    icon: ClipboardList,
  },
  {
    to: "/relatorios/programa-medicamento",
    title: "Por medicamento",
    description: "Adesão e engajamento segmentados por medicamento do programa.",
    icon: Pill,
    feature: FEATURE_KEYS.reportsCohort,
  },
];

export function ReportsHubPage() {
  const { hasFeature } = useAuth();

  const visibleLinks = REPORT_LINKS.filter((link) => {
    if (link.to === "/relatorios/conversacional") {
      return (
        hasFeature(FEATURE_KEYS.reportsConversationQuality) ||
        hasFeature(FEATURE_KEYS.reportsRetentionChurn) ||
        hasFeature(FEATURE_KEYS.reportsOnboardingFunnel) ||
        hasFeature(FEATURE_KEYS.reportsHandoffs) ||
        hasFeature(FEATURE_KEYS.reportsBasic)
      );
    }
    if (link.to === "/relatorios/operacao") {
      return hasFeature(FEATURE_KEYS.reportsOperations) || hasFeature(FEATURE_KEYS.reportsBySender);
    }
    if (link.to === "/relatorios/escalas") {
      return hasFeature(FEATURE_KEYS.scalesMorisky) || hasFeature(FEATURE_KEYS.scalesTpb);
    }
    if (link.to === "/relatorios/engajamento") {
      return hasFeature(FEATURE_KEYS.reportsAdvanced) || hasFeature(FEATURE_KEYS.reportsCohort);
    }
    return !link.feature || hasFeature(link.feature);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl">Visão geral</h2>
        <p className="text-sm text-muted-foreground">
          Escolha uma área de relatório. O filtro de período acima se aplica a todas as páginas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {visibleLinks.map((link) => (
          <Card key={link.to}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <link.icon className="size-4 text-primary" />
                {link.title}
              </CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link to={link.to}>
                  Abrir relatório
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
