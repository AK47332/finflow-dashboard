import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [memberCheck, setMemberCheck] = useState<{ loading: boolean; isMember: boolean }>({
    loading: true,
    isMember: false,
  });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMemberCheck({ loading: false, isMember: false });
      return;
    }
    setMemberCheck({ loading: true, isMember: false });
    (async () => {
      const { data } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setMemberCheck({ loading: false, isMember: !!data });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || orgLoading || saLoading || memberCheck.loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;

  // Ecom customers (no org membership and not super admin) must NEVER see the
  // admin app. Redirect them to their customer area on the storefront.
  if (!isSuperAdmin && !memberCheck.isMember) {
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