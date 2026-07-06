import { Link } from "react-router-dom";
import { ArrowRight, Brain, ClipboardCheck, Heart, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TPB_CONSTRUCT_DESCRIPTIONS } from "@/lib/constants";

export function TpbSciencePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Base científica TCP"
        description="Teoria do Comportamento Planejado (Ajzen, 1988) — como medimos intenção e adesão no Kokoro."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="size-5 text-primary" />
            Modelo Ajzen
          </CardTitle>
          <CardDescription>
            Três construtos motivacionais convergem em intenção, que prediz o comportamento de adesão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap text-foreground">{`🧠 Atitude          ╮
👥 Normas Subjetivas  →  💡 Intenção  →  ✅ Adesão real
💪 Controle Percebido ╯`}</pre>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {(["attitude", "subjective_norm", "perceived_control"] as const).map((key) => (
              <Card key={key} className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {TPB_CONSTRUCT_DESCRIPTIONS[key].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {TPB_CONSTRUCT_DESCRIPTIONS[key].body}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="size-5 text-primary" />
            Camada observada — Histórico e hábitos
          </CardTitle>
          <CardDescription>
            Complementa a TCP: mede comportamento real, não só intenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-3 rounded-lg border p-4">
            <Heart className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Morisky (MMAS-8)</p>
              <p className="text-xs text-muted-foreground">
                Escala validada de adesão medicamentosa — comportamento reportado pelo paciente.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border p-4">
            <Users className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Check-ins diários</p>
              <p className="text-xs text-muted-foreground">
                Respostas no WhatsApp nos lembretes — adesão observada em tempo real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como o Kokoro atua</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A escala TCP mede <Badge variant="outline">intenção</Badge> nos três fatores motivacionais.
            Morisky e check-ins medem <Badge variant="outline">comportamento</Badge>. Intervenções e
            nudges são direcionados ao construto mais fraco identificado na avaliação.
          </p>
          <Link
            to="/tcp"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Configurar escala TCP
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
