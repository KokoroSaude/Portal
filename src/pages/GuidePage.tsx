import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { GuideSteps } from "@/components/guide/GuideSteps";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { countGuideSteps, filterGuideSections, getGuideForAudience } from "@/lib/guides";

export function GuidePage() {
  const { isPlatform, hasFeature } = useAuth();
  const guide = getGuideForAudience(isPlatform);
  const sections = filterGuideSections(guide, hasFeature);
  const totalSteps = countGuideSteps(sections);

  return (
    <div className="space-y-8">
      <PageHeader title={guide.title} description={guide.subtitle} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <BookOpen className="size-3.5" />
          {totalSteps} passos
        </Badge>
        <Badge variant="outline">{isPlatform ? "Superadmin" : "Operação tenant"}</Badge>
        {!isPlatform && (
          <Button asChild variant="link" className="h-auto px-0 text-sm">
            <Link to="/configuracoes">Ver plano e features →</Link>
          </Button>
        )}
      </div>

      <GuideSteps sections={sections} />

      <p className="border-t pt-6 text-center text-sm text-muted-foreground">
        Dúvidas sobre uma tela específica? Use os links &quot;Ir para esta etapa&quot; em cada passo.
      </p>
    </div>
  );
}
