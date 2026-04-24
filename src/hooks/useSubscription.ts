import { useSession } from "@/contexts/SessionContext";

export type SubscriptionInfo = {
  expiresAt: Date | null;
  hasSubscription: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
};

/**
 * Thin context consumer. See SessionProvider — single fetch per session.
 */
export function useSubscription() {
  const { subscription, loading } = useSession();
  return { ...subscription, loading };
}