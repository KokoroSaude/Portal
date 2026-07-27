export const DOCS_URL = "https://docs.kokorosaude.com.br";

export function isAllowedReturnTo(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "docs.kokorosaude.com.br" ||
        parsed.hostname.endsWith(".kokorosaude.com.br"))
    );
  } catch {
    return false;
  }
}

export function resolveAuthReturnTarget(
  returnToParam: string | null,
  fromState: string | undefined,
  fallback = "/",
): string {
  if (returnToParam && isAllowedReturnTo(returnToParam)) return returnToParam;
  return fromState ?? fallback;
}

export function redirectAfterAuth(
  target: string,
  navigate: (to: string, options?: { replace?: boolean }) => void,
) {
  if (target.startsWith("http://") || target.startsWith("https://")) {
    window.location.assign(target);
    return;
  }
  navigate(target, { replace: true });
}
