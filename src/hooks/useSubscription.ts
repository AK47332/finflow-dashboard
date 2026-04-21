import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionInfo = {
  expiresAt: Date | null;
  hasSubscription: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo>({
    expiresAt: null,
    hasSubscription: false,
    isExpired: false,
    daysRemaining: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      if (!data) {
        setInfo({
          expiresAt: null,
          hasSubscription: false,
          isExpired: false,
          daysRemaining: null,
        });
      } else {
        const exp = new Date(data.expires_at);
        const now = new Date();
        const ms = exp.getTime() - now.getTime();
        const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
        setInfo({
          expiresAt: exp,
          hasSubscription: true,
          isExpired: ms <= 0,
          daysRemaining: days,
        });
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { ...info, loading };
}