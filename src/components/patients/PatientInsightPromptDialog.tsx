import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

type Props = {
  token: string;
  patientId: string;
};

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function PatientInsightPromptDialog({ token, patientId }: Props) {
  const [open, setOpen] = useState(false);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["patient-insight-prompt", patientId],
    queryFn: () => api.getPatientInsightPrompt(token, patientId),
    enabled: open,
    retry: false,
  });

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        Ver prompt
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt enviado ao LLM</DialogTitle>
            <DialogDescription>
              Resumo do paciente — instrução do sistema + JSON com dados agregados.
            </DialogDescription>
          </DialogHeader>
          {isFetching && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Não foi possível carregar o prompt."}
            </p>
          )}
          {data && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Provedor: <span className="font-mono text-foreground">{data.provider}</span>
                {" · "}
                Modelo: <span className="font-mono text-foreground">{data.model}</span>
              </p>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  System (instrução)
                </p>
                <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                  {data.systemPrompt}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User (dados do paciente)
                </p>
                <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                  {formatJson(data.userMessage)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
