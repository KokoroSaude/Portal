import { BookOpen, ExternalLink } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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

function isPlataformaDocsUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    return path === "/plataforma" || path.startsWith("/plataforma/");
  } catch {
    return url.includes("/plataforma");
  }
}

/**
 * Abre a documentação oficial em nova aba.
 * Sem `href`/`docsPath`, resolve automaticamente pela rota atual.
 * Links `/plataforma/*` só para SuperAdmin (mesmo gate do site MkDocs).
 */
export function DocsHelpButton({
  docsPath,
  href,
  className,
  label = "Documentação",
}: DocsHelpButtonProps) {
  const { pathname, search } = useLocation();
  const { isPlatform } = useAuth();
  const resolved =
    href ??
    (docsPath
      ? `${DOCS_URL.replace(/\/$/, "")}/${docsPath.replace(/^\//, "").replace(/\/$/, "")}/`
      : resolvePageDocsUrl(pathname, search));

  if (!resolved) return null;
  if (isPlataformaDocsUrl(resolved) && !isPlatform) return null;

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
