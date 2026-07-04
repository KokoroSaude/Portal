import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReportTableCardProps = {
  title: string;
  description?: string;
  count?: number;
  children: ReactNode;
  className?: string;
};

export function ReportTableCard({
  title,
  description,
  count,
  children,
}: ReportTableCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
        <div>
          <CardTitle className="font-serif text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">{count} registro(s)</span>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
