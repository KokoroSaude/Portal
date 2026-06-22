import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

/** Limpa cache de settings ao trocar de organização ou sessão. */
export function AuthQuerySync() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = auth?.user?.tenantId ?? null;

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["settings"] });
  }, [tenantId, auth?.token, queryClient]);

  return null;
}
