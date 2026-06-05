import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  AUTH_STORAGE_KEY,
  clearAuth,
  IMPERSONATION_STORAGE_KEY,
  loadAuth,
  saveAuth,
  type StoredAuth,
} from "@/lib/api";
import type { LoginResponse, TenantFeature } from "@/types/api";

interface AuthContextValue {
  auth: StoredAuth | null;
  isAuthenticated: boolean;
  isPlatform: boolean;
  isTenant: boolean;
  isAdmin: boolean;
  canWrite: boolean;
  isViewer: boolean;
  isImpersonating: boolean;
  displayName: string;
  role: string | null;
  login: (email: string, password: string) => Promise<"tenant" | "platform">;
  logout: () => void;
  refreshSession: () => Promise<void>;
  impersonateTenant: (tenantId: string) => Promise<void>;
  exitImpersonation: () => void;
  hasFeature: (key: string) => boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toStoredAuth(res: LoginResponse, extra?: Partial<StoredAuth>): Omit<StoredAuth, "expiresAt"> {
  return {
    token: res.token,
    scope: res.scope,
    user: res.user,
    platformUser: res.platformUser,
    features: res.features ?? [],
    ...extra,
  };
}

function applyLoginResponse(res: LoginResponse, extra?: Partial<StoredAuth>): StoredAuth {
  const stored = toStoredAuth(res, extra);
  saveAuth(stored, res.expiresIn);
  return { ...stored, expiresAt: Date.now() + res.expiresIn * 1000 };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => loadAuth());

  const refreshSession = useCallback(async () => {
    const current = loadAuth();
    if (!current?.token) return;

    try {
      const res = await api.refreshToken(current.token);
      const stored = applyLoginResponse(res, {
        impersonating: current.impersonating,
      });
      setAuth(stored);
    } catch {
      clearAuth();
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      setAuth(null);
    }
  }, []);

  useEffect(() => {
    if (!auth?.token) return;

    const msUntilRefresh = auth.expiresAt - Date.now() - 5 * 60 * 1000;
    const delay = Math.max(msUntilRefresh, 0);

    const timer = window.setTimeout(() => {
      void refreshSession();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [auth?.expiresAt, auth?.token, refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    const res = await api.login(email, password);
    const stored = applyLoginResponse(res);
    setAuth(stored);
    return res.scope;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    setAuth(null);
  }, []);

  const impersonateTenant = useCallback(async (tenantId: string) => {
    const current = loadAuth();
    if (!current?.token || current.scope !== "platform") {
      throw new Error("Apenas superadmins podem impersonar tenants.");
    }

    localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(current));
    const res = await api.adminImpersonateTenant(current.token, tenantId);
    const stored = applyLoginResponse(res, { impersonating: true });
    setAuth(stored);
  }, []);

  const exitImpersonation = useCallback(() => {
    const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (!raw) {
      logout();
      return;
    }

    const original = JSON.parse(raw) as StoredAuth;
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(original));
    setAuth(original);
  }, [logout]);

  const hasFeature = useCallback(
    (key: string) => auth?.features.some((f: TenantFeature) => f.key === key && f.enabled) ?? false,
    [auth],
  );

  const role = auth?.user?.role ?? auth?.platformUser?.role ?? null;
  const isAdmin = role === "Admin" || role === "SuperAdmin";
  const isViewer = role === "Viewer";
  const canWrite = isAdmin || role === "Operator";

  const displayName = auth?.user?.name ?? auth?.platformUser?.name ?? "Usuário";

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: !!auth?.token,
      isPlatform: auth?.scope === "platform" && !auth.impersonating,
      isTenant: auth?.scope === "tenant" || !!auth?.impersonating,
      isAdmin,
      canWrite,
      isViewer,
      isImpersonating: !!auth?.impersonating,
      displayName,
      role,
      login,
      logout,
      refreshSession,
      impersonateTenant,
      exitImpersonation,
      hasFeature,
      token: auth?.token ?? null,
    }),
    [
      auth,
      canWrite,
      displayName,
      exitImpersonation,
      hasFeature,
      impersonateTenant,
      isAdmin,
      isViewer,
      login,
      logout,
      refreshSession,
      role,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
