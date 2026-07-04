import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export function ConversationalSimulatorPage() {
  const { token } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [message, setMessage] = useState("");
  const [surface, setSurface] = useState<string>("none");
  const [scenario, setScenario] = useState("ActiveFreeText");

  const simulate = useMutation({
    mutationFn: () =>
      api.simulateConversation(token!, {
        patientId,
        patientMessage: message,
        openSurfaceKind: surface === "none" ? null : surface,
        scenario,
      }),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulador conversacional</CardTitle>
          <CardDescription>
            Teste roteamento tier2/tier3, delay estimado e bolhas sem enviar WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patientId">ID do paciente</Label>
            <Input
              id="patientId"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="uuid do paciente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem do paciente</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Superfície aberta</Label>
              <Select value={surface} onValueChange={setSurface}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="ActiveMenu">Menu ativo</SelectItem>
                  <SelectItem value="CheckinButtons">Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cenário guidance</Label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ActiveFreeText">Texto livre ativo</SelectItem>
                  <SelectItem value="MenuOpenFreeText">Menu aberto</SelectItem>
                  <SelectItem value="OnboardingDeviation">Desvio onboarding</SelectItem>
                  <SelectItem value="RetentionIntercept">Retenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            disabled={!token || !patientId || !message || simulate.isPending}
            onClick={() => simulate.mutate()}
          >
            Simular
          </Button>

          {simulate.data && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <p>
                <strong>Tier:</strong> {simulate.data.tier}
              </p>
              {simulate.data.mappedAction && (
                <p>
                  <strong>Ação mapeada:</strong> {simulate.data.mappedAction} (
                  {simulate.data.confidence?.toFixed(2)})
                </p>
              )}
              <p>
                <strong>Bolhas:</strong> {simulate.data.bubbleCount} ·{" "}
                <strong>Delay:</strong> {simulate.data.estimatedDelaySeconds.toFixed(1)}s
              </p>
              {simulate.data.guidancePreview && (
                <pre className="whitespace-pre-wrap text-xs">{simulate.data.guidancePreview}</pre>
              )}
            </div>
          )}

          {simulate.error && (
            <p className="text-sm text-destructive">{(simulate.error as Error).message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
