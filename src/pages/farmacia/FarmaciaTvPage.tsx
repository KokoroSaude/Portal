import { useEffect, useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantSettings } from "@/hooks/useTenantSettings";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export function FarmaciaTvPage() {
  const { token, isTenant } = useAuth();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token");
  const { settings, pickupAccess, isLoading: settingsLoading } = useTenantSettings();

  const tvToken =
    urlToken ?? (pickupAccess ? (settings?.pickupTvDisplayToken ?? null) : null);

  const { data, isError } = useQuery({
    queryKey: ["pickup-tv", tvToken],
    queryFn: () => api.getPickupTvDisplay(tvToken!),
    enabled: !!tvToken,
    refetchInterval: 5_000,
  });

  const latest = data?.recentCalls?.[0];

  useEffect(() => {
    document.documentElement.classList.add("overflow-hidden");
    return () => document.documentElement.classList.remove("overflow-hidden");
  }, []);

  const history = useMemo(() => data?.recentCalls?.slice(1, 8) ?? [], [data]);

  if (token && isTenant && !urlToken) {
    if (settingsLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white/60">
          Carregando…
        </div>
      );
    }
    if (!pickupAccess) {
      return <Navigate to="/" replace />;
    }
  }

  if (!tvToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-center text-white">
        <div>
          <p className="font-serif text-2xl">Painel de senhas</p>
          <p className="mt-2 text-slate-400">
            Configure o token do painel TV em Configurações ou acesse com{" "}
            <code className="text-sm">?token=...</code>
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        Token inválido ou painel indisponível.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-primary/30 p-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/60">Farmácia</p>
            <h1 className="font-serif text-2xl">Senhas de atendimento</h1>
          </div>
          {data?.generatedAt && (
            <p className="text-xs text-white/50">Atualizado {formatDateTime(data.generatedAt)}</p>
          )}
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          {latest ? (
            <>
              <p className="text-lg text-white/70">{latest.medicationName}</p>
              <p className="mt-2 font-serif text-8xl font-bold tracking-tight md:text-9xl">
                {latest.queuePassword}
              </p>
              <p className="mt-4 text-2xl">{latest.patientName ?? "Paciente"}</p>
              <p className="mt-1 text-sm text-white/50">{formatDateTime(latest.issuedAt)}</p>
            </>
          ) : (
            <p className="py-16 text-xl text-white/60">Aguardando próxima chamada…</p>
          )}
        </section>

        {history.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm uppercase tracking-wider text-white/50">Anteriores</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((entry, i) => (
                <li
                  key={`${entry.queuePassword}-${entry.issuedAt}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="font-mono text-xl font-semibold">{entry.queuePassword}</span>
                  <span className="truncate text-sm text-white/70">{entry.patientName ?? "—"}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
