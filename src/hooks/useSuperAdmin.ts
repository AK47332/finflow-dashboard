import { useSession } from "@/contexts/SessionContext";

/**
 * Thin context consumer. The actual query runs once in `SessionProvider` so
 * that components calling `useSuperAdmin()` from many places do not each
 * trigger a fresh request on every render.
 */
export function useSuperAdmin() {
  const { isSuperAdmin, loading } = useSession();
  return { isSuperAdmin, loading };
}