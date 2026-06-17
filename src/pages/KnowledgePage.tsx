import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Trash2, Upload } from "lucide-react";
import { PageHeader, FeatureLocked } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiClientError } from "@/lib/api";
import { FEATURE_KEYS } from "@/lib/constants";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KnowledgePage() {
  const { token, hasFeature } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge-documents"],
    queryFn: () => api.listKnowledgeDocuments(token!),
    enabled: !!token && hasFeature(FEATURE_KEYS.aiCopilot),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadKnowledgeDocument(token!, file, title || undefined),
    onSuccess: () => {
      toast.success("Documento enviado e indexado no RAG");
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao enviar documento"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteKnowledgeDocument(token!, id),
    onSuccess: () => {
      toast.success("Documento removido");
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Erro ao remover"),
  });

  if (!hasFeature(FEATURE_KEYS.aiCopilot)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Base de conhecimento" description="Documentos para contexto da IA (RAG)" />
        <FeatureLocked title="Assistente IA" description="Recurso indisponível no plano atual." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Base de conhecimento"
        description="Manuais e FAQs usados pela IA ao personalizar mensagens. Arquivos ficam no S3 e entram no índice RAG."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <Upload className="size-5" />
            Enviar documento
          </CardTitle>
          <CardDescription>
            Formatos: .txt, .md, .csv, .html — até 5 MB. Após o envio, o índice RAG do tenant é atualizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="knowledge-title">Título (opcional)</Label>
            <Input
              id="knowledge-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Protocolo de adesão"
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.html,.htm,text/plain,text/markdown,text/csv,text/html"
              className="max-w-md"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-lg">
            <BookOpen className="size-5" />
            Documentos indexados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento ainda. Envie manuais, FAQs ou políticas da farmácia.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.fileName}</TableCell>
                    <TableCell>{formatBytes(doc.fileSizeBytes)}</TableCell>
                    <TableCell>{new Date(doc.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
