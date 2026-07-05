import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAllowedReturnTo, redirectAfterAuth } from "@/lib/auth-redirect";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get("returnTo");
  const externalReturn = returnTo && isAllowedReturnTo(returnTo) ? returnTo : null;

  useEffect(() => {
    if (isAuthenticated && externalReturn) {
      redirectAfterAuth(externalReturn, () => {});
    }
  }, [isAuthenticated, externalReturn]);

  if (isAuthenticated) {
    if (externalReturn) return null;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
