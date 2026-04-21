import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { ExpiredScreen } from "./ExpiredScreen";

export function ExpiryGate() {
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();
  const sub = useSubscription();

  if (saLoading || sub.loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Super-admins always have access
  if (isSuperAdmin) return <Outlet />;

  // Customers without a subscription record OR expired → blocked
  if (!sub.hasSubscription || sub.isExpired) {
    return <ExpiredScreen />;
  }

  return <Outlet />;
}