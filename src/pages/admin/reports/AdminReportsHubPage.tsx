import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ClipboardList,
  GitCompare,
  MessageSquare,
  ScrollText,
  Send,
  Sparkles,
} from "lucide-react";
import { ReportHubCard } from "@/components/reports/ReportHubCard";

const ADMIN_REPORT_CARDS = [
  {
    icon: Activity,
    title: "Adesão",
    description: "Taxa de adesão consolidada, tendências e detalhe por organização.",
    to: "/admin/relatorios/adesao",
  },
  {
    icon: MessageSquare,
    title: "Engajamento",
    description: "Respostas por tipo de mensagem e funil de pacientes.",
    to: "/admin/relatorios/engajamento",
  },
  {
    icon: Send,
    title: "Operação",
    description: "Lembretes, volume de mensagens, satisfação e latência clínica.",
    to: "/admin/relatorios/operacao",
  },
  {
    icon: ClipboardList,
    title: "Escalas",
    description: "Avaliações Morisky (MMAS-8) consolidadas por organização.",
    to: "/admin/relatorios/escalas",
  },
  {
    icon: ScrollText,
    title: "Rastreabilidade",
    description: "Audit log e eventos de interação no período.",
    to: "/admin/relatorios/rastreabilidade",
  },
  {
    icon: BarChart3,
    title: "Remetentes",
    description: "Performance por número WhatsApp nas organizações selecionadas.",
    to: "/admin/relatorios/remetentes",
  },
  {
    icon: GitCompare,
    title: "Comparativo",
    description: "Variação de adesão entre período atual e anterior.",
    to: "/admin/relatorios/comparativo",
  },
] as const;

export function AdminReportsHubPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Escolha uma área. Organizações e período ficam na barra ao abrir cada relatório.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_REPORT_CARDS.map((card) => (
          <ReportHubCard key={card.to} {...card} compact />
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="size-4 text-primary" />
          Dica
        </p>
        <p className="mt-1">
          Exporte PDF na tela de{" "}
          <Link to="/admin/relatorios/adesao" className="text-primary hover:underline">
            Adesão
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
