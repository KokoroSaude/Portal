import { useMemo } from "react";
import { X } from "lucide-react";
import { GridSearchBar } from "@/components/grid/GridSearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGridSearch } from "@/hooks/useGridSearch";
import { matchesGridSearch } from "@/lib/gridSearch";
import { cn } from "@/lib/utils";
import type { AdminTenant } from "@/types/api";

type Props = {
  tenants: AdminTenant[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
};

export function AdminReportTenantSelector({ tenants, selectedIds, onChange }: Props) {
  const { input, setInput, query } = useGridSearch();

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => matchesGridSearch(query, t.name, t.slug));
  }, [tenants, query]);

  const selectedTenants = useMemo(
    () => tenants.filter((t) => selectedIds.has(t.id)),
    [tenants, selectedIds],
  );

  const allFilteredSelected =
    filteredTenants.length > 0 && filteredTenants.every((t) => selectedIds.has(t.id));
  const someFilteredSelected = filteredTenants.some((t) => selectedIds.has(t.id));

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(next);
  };

  const toggleAllFiltered = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredTenants.forEach((t) => next.delete(t.id));
    } else {
      filteredTenants.forEach((t) => next.add(t.id));
    }
    onChange(next);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-serif text-lg">Organizações no relatório</CardTitle>
          <CardDescription>
            {selectedIds.size === 0
              ? "Selecione ao menos uma organização ativa"
              : `${selectedIds.size} de ${tenants.length} organização(ões) ativa(s) selecionada(s)`}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(new Set(tenants.map((t) => t.id)))}
          >
            Todas ativas
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(new Set())}>
            Limpar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {selectedTenants.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Selecionados
            </p>
            <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
              {selectedTenants.map((t) => (
                <Badge key={t.id} variant="secondary" className="gap-1 pr-1 font-normal">
                  <span className="max-w-[160px] truncate">{t.name}</span>
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-background/80"
                    aria-label={`Remover ${t.name}`}
                    onClick={() => toggle(t.id, false)}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <GridSearchBar
          value={input}
          onChange={setInput}
          placeholder="Buscar por nome ou slug"
          resultCount={filteredTenants.length}
          totalCount={tenants.length}
        />

        {filteredTenants.length > 0 && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={toggleAllFiltered}>
              {allFilteredSelected ? "Desmarcar visíveis" : "Selecionar visíveis"}
              {query.trim() ? ` (${filteredTenants.length})` : ""}
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAllFiltered}
                      aria-label="Selecionar todas as organizações visíveis"
                    />
                  </TableHead>
                  <TableHead>Organização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhuma organização ativa corresponde à busca.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((t) => (
                    <TableRow
                      key={t.id}
                      className={cn(selectedIds.has(t.id) && "bg-primary/5")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(t.id)}
                          onCheckedChange={(v) => toggle(t.id, v === true)}
                          aria-label={`Selecionar ${t.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{t.slug}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
