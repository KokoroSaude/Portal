import { useState } from "react";
import { Building2 } from "lucide-react";
import { AdminReportTenantSelector } from "@/components/admin/AdminReportTenantSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminReportTenants } from "@/contexts/AdminReportTenantContext";
import { useActiveAdminTenants } from "@/hooks/useAdminTenants";

export function AdminReportScopeControl() {
  const [open, setOpen] = useState(false);
  const { selectedIds, setSelectedIds } = useAdminReportTenants();
  const { tenants: activeTenants } = useActiveAdminTenants();

  const label =
    selectedIds.size === 0
      ? "Nenhuma org"
      : selectedIds.size === 1
        ? "1 organização"
        : `${selectedIds.size} organizações`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 font-normal">
          <Building2 className="size-3.5" />
          {label}
        </Badge>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
            Alterar
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Organizações no relatório</DialogTitle>
          <DialogDescription>
            Escolha quais organizações entram nos números consolidados.
          </DialogDescription>
        </DialogHeader>
        <AdminReportTenantSelector
          tenants={activeTenants}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
      </DialogContent>
    </Dialog>
  );
}
