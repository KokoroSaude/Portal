import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ComplianceMarkdown } from "@/components/compliance/ComplianceMarkdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

type Props = {
  token: string;
  slug: string | null;
  onClose: () => void;
};

export function ComplianceDocumentDialog({ token, slug, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["compliance-document", slug],
    queryFn: () => api.getComplianceDocument(token, slug!),
    enabled: !!slug,
  });

  return (
    <Dialog open={slug !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle>{data?.title ?? "Documento"}</DialogTitle>
          <DialogDescription>
            {data?.category ?? "Privacidade e segurança"}
            {data?.lastModified
              ? ` · Atualizado em ${new Date(data.lastModified).toLocaleDateString("pt-BR")}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando documento…
            </div>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              Não foi possível carregar o documento. Tente novamente mais tarde.
            </p>
          )}
          {data?.content && <ComplianceMarkdown content={data.content} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
