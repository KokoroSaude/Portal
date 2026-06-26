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
import { Badge } from "@/components/ui/badge";
import { GridEmptyRow } from "@/components/grid/GridEmptyRow";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

function statusBadgeVariant(
  statusCode: number,
): "default" | "secondary" | "success" | "warning" | "outline" {
  if (statusCode >= 200 && statusCode < 300) return "success";
  if (statusCode >= 400 && statusCode < 500) return "warning";
  if (statusCode >= 500) return "secondary";
  return "outline";
}

export function ErpIntegrationLogCard() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["integration-audit"],
    queryFn: () => api.listIntegrationAudit(token!, 50),
    enabled: !!token,
    refetchInterval: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Log de integração ERP</CardTitle>
        <CardDescription>Últimas 50 chamadas recebidas na API externa de retirada.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>ms</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).length === 0 ? (
                  <GridEmptyRow colSpan={8} message="Nenhuma chamada registrada ainda." />
                ) : (
                  (data ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.httpMethod}</TableCell>
                      <TableCell className="max-w-[12rem] truncate font-mono text-xs">
                        {entry.path}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(entry.statusCode)}>{entry.statusCode}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {entry.credentialPrefix ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{entry.clientIp ?? "—"}</TableCell>
                      <TableCell className="text-xs">{entry.durationMs}</TableCell>
                      <TableCell className="max-w-[8rem] truncate text-xs text-muted-foreground">
                        {entry.errorCode ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
