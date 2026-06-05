import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ImpersonationBanner() {
  const { isImpersonating, auth, exitImpersonation } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          Visualizando como tenant · <strong>{auth?.user?.email}</strong>
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={exitImpersonation}>
        Sair da impersonação
      </Button>
    </div>
  );
}
