import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ReportHubCardProps = {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
};

export function ReportHubCard({
  to,
  title,
  description,
  icon: Icon,
  compact = false,
}: ReportHubCardProps) {
  return (
    <Card className={cn(compact && "shadow-none")}>
      <CardHeader className={cn("pb-2", compact && "p-4 pb-1")}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 shrink-0 text-primary" />
          {title}
        </CardTitle>
        {!compact && <CardDescription className="line-clamp-2">{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn(compact && "p-4 pt-2")}>
        <Button variant="outline" size="sm" asChild>
          <Link to={to}>
            Abrir
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
