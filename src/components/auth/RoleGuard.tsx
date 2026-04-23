import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { canAccess, defaultLandingFor } from "@/lib/permissions";

/**
 * Route-level access control based on the user's org role.
 *
 * Super admins and owners/admins bypass; team members are redirected to
 * their default landing page (or /dashboard) when they request a path
 * they're not allowed to see.
 */
export function RoleGuard() {
  const { role } = useOrg();
  const { isSuperAdmin } = useSuperAdmin();
  const location = useLocation();

  if (isSuperAdmin) return <Outlet />;
  if (canAccess(role, location.pathname)) return <Outlet />;

  const fallback = defaultLandingFor(role);
  // Avoid redirect loops if the fallback itself is denied (shouldn't happen).
  if (location.pathname === fallback) return <Outlet />;
  return <Navigate to={fallback} replace />;
}