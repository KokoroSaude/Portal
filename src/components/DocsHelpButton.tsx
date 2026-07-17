import { BookOpen, ExternalLink } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DOCS_URL } from "@/lib/auth-redirect";
import { resolvePageDocsUrl } from "@/lib/page-docs";
import { cn } from "@/lib/utils";

type DocsHelpButtonProps = {
  /** Sobrescreve o path MkDocs (sem domínio), ex.: "configuracoes/pack-bct" */
  docsPath?: string;
  /** Força URL absoluta */
  href?: string;
  className?: string;
  label?: string;
};

/**
 * Abre a documentação oficial em nova aba.
 * Sem `href`/`docsPath`, resolve automaticamente pela rota atual.
 */
export function DocsHelpButton({
  docsPath,
  href,
  className,
  label = "Documentação",
}: DocsHelpButtonProps) {
  const { pathname, search } = useLocation();
  const resolved =
    href ??
    (docsPath
      ? `${DOCS_URL.replace(/\/$/, "")}/${docsPath.replace(/^\//, "").replace(/\/$/, "")}/`
      : resolvePageDocsUrl(pathname, search));

  if (!resolved) return null;

  return (
    <Button asChild variant="outline" size="sm" className={cn("gap-1.5", className)}>
      <a href={resolved} target="_blank" rel="noopener noreferrer">
        <BookOpen className="size-3.5" />
        {label}
        <ExternalLink className="size-3 opacity-70" />
      </a>
    </Button>
  );
}
