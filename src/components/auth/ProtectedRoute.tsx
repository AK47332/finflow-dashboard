import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useSession } from "@/contexts/SessionContext";
import { Loader2 } from "lucide-react";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { currentOrgId, loading: orgLoading } = useOrg();
  const { isSuperAdmin, isOrgMember, loading: sessionLoading } = useSession();
  const location = useLocation();

  if (authLoading || orgLoading || sessionLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;

  // Ecom customers (no org membership and not super admin) must NEVER see the
  // admin app. Redirect them to their customer area on the storefront.
  if (!isSuperAdmin && !isOrgMember) {
    if (location.pathname === "/onboarding") {
      // They cannot create orgs from this signup flow.
      return <Navigate to="/account" replace />;
    }
    return <Navigate to="/account" replace />;
  }

  // Super-admins can access admin routes without an org
  if (
    !currentOrgId &&
    location.pathname !== "/onboarding" &&
    !(isSuperAdmin && location.pathname.startsWith("/admin"))
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}