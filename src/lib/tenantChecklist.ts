const STORAGE_PREFIX = "kokoro.tenant.checklist";

export type TenantChecklistKey = "whatsapp" | "messages" | "patient";

function storageKey(key: TenantChecklistKey): string {
  return `${STORAGE_PREFIX}.${key}`;
}

export function markChecklistStep(key: TenantChecklistKey): void {
  try {
    localStorage.setItem(storageKey(key), "done");
  } catch {
    /* ignore quota / private mode */
  }
}

export function isChecklistStepMarked(key: TenantChecklistKey): boolean {
  try {
    return localStorage.getItem(storageKey(key)) === "done";
  } catch {
    return false;
  }
}

export function markChecklistFromPath(pathname: string): void {
  if (pathname.startsWith("/whatsapp")) markChecklistStep("whatsapp");
  if (pathname.startsWith("/templates") || pathname.startsWith("/jornada")) {
    markChecklistStep("messages");
  }
  if (pathname.startsWith("/pacientes")) markChecklistStep("patient");
}
