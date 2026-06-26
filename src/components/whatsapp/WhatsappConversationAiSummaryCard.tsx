import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { aiSourceLabel } from "@/lib/ai-status";
import { formatDateTime } from "@/lib/utils";

type WhatsappConversationAiSummaryCardProps = {
  token: string;
  patientId: string;
};

export function WhatsappConversationAiSummaryCard({
  token,
  patientId,
}: WhatsappConversationAiSummaryCardProps) {
  const summary = useQuery({
    queryKey: ["whatsapp-conversation-ai-summary", patientId],
    queryFn: () => api.getConversationAiSummary(token, patientId),
    enabled: !!token && !!patientId,
    staleTime: 60_000,
  });

  if (summary.isLoading) {
    return <Skeleton className="mx-4 mb-3 h-24 w-auto" />;
  }

  if (!summary.data) return null;

  return (
    <Card className="mx-4 mb-3 border-primary/20 bg-primary/[0.03]">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            Resumo da conversa
          </CardTitle>
          <CardDescription className="text-xs">
            {formatDateTime(summary.data.generatedAt)}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{aiSourceLabel(summary.data.source)}</Badge>
          <Button type="button" variant="ghost" size="sm" onClick={() => summary.refetch()}>
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{summary.data.summary}</p>
        <p className="text-xs text-muted-foreground">
          Risco: <span className="font-medium text-foreground">{summary.data.riskLevel}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Próxima ação: {summary.data.suggestedNextAction}
        </p>
      </CardContent>
    </Card>
  );
}
