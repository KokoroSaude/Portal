const LOCAL_API = "http://localhost:5000";
const PRODUCTION_API = "https://api-production-a8b61.up.railway.app";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** URL base da API — Vite injeta VITE_API_URL no build; em produção nunca usa localhost. */
export function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();

  if (fromEnv && !(import.meta.env.PROD && isLocalhostUrl(fromEnv)))
    return normalizeBaseUrl(fromEnv);

  if (import.meta.env.PROD)
    return PRODUCTION_API;

  return LOCAL_API;
}

export const API_BASE = resolveApiBaseUrl();
