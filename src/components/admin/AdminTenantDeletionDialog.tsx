import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminDeletedTenant, AdminTenant } from "@/types/api";

type TenantRef = Pick<AdminTenant | AdminDeletedTenant, "id" | "name" | "slug">;

type Props = {
  tenant: TenantRef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "soft-delete" | "purge";
  loading?: boolean;
  onConfirm: (confirmSlug: string, totpCode: string) => void;
};

export function AdminTenantDeletionDialog({
  tenant,
  open,
  onOpenChange,
  mode,
  loading,
  onConfirm,
}: Props) {
  const [confirmSlug, setConfirmSlug] = useState("");
  const [totpCode, setTotpCode] = useState("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setConfirmSlug("");
      setTotpCode("");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    onConfirm(confirmSlug.trim().toLowerCase(), totpCode.trim());
  }

  const slugMatches = tenant ? confirmSlug.trim().toLowerCase() === tenant.slug : false;
  const isSoftDelete = mode === "soft-delete";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isSoftDelete ? "Excluir organização" : "Excluir permanentemente"}
            </DialogTitle>
            <DialogDescription>
              {isSoftDelete ? (
                <>
                  A organização <strong>{tenant?.name}</strong> será desativada e mantida por 30 dias
                  antes da remoção definitiva. Você poderá restaurá-la nesse período.
                </>
              ) : (
                <>
                  Todos os dados de <strong>{tenant?.name}</strong> serão removidos de forma
                  irreversível. Esta ação não pode ser desfeita.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-slug">
                Digite o slug <span className="font-mono">{tenant?.slug}</span> para confirmar
              </Label>
              <Input
                id="confirm-slug"
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
                placeholder={tenant?.slug}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-totp">Código TOTP (autenticador)</Label>
              <Input
                id="delete-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || !slugMatches || totpCode.length < 6}
            >
              {loading
                ? "Processando…"
                : isSoftDelete
                  ? "Excluir organização"
                  : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
