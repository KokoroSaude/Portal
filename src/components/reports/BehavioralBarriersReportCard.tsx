import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDateTime, formatPercent } from "@/lib/utils";

type BehavioralBarriersReportCardProps = {
  token: string;
};

export function BehavioralBarriersReportCard({ token }: BehavioralBarriersReportCardProps) {
  const report = useQuery({
    queryKey: ["behavioral-barriers-report"],
    queryFn: () => api.getBehavioralBarriersReport(token),
    enabled: !!token,
  });

  if (report.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!report.data || report.data.barriers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Barreiras comportamentais</CardTitle>
        <CardDescription>
          Pacientes com adesão &lt; 60% por barreira principal ({report.data.totalPatientsWithProfile}{" "}
          perfis) · {formatDateTime(report.data.generatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barreira</TableHead>
              <TableHead className="text-right">Pacientes</TableHead>
              <TableHead className="text-right">Adesão baixa</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.data.barriers.map((row) => (
              <TableRow key={row.barrier}>
                <TableCell>{row.barrierLabel}</TableCell>
                <TableCell className="text-right">{row.patientCount}</TableCell>
                <TableCell className="text-right">{row.lowAdherenceCount}</TableCell>
                <TableCell className="text-right">{formatPercent(row.lowAdherencePercent / 100)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
