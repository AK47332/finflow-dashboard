import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
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
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();
  const location = useLocation();

  if (authLoading || orgLoading || saLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
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