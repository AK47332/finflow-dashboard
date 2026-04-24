import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { SUPER_ADMIN_EMAILS } from "@/lib/superAdminConfig";

/**
 * Single source of truth for "session-derived" user state that used to be
 * fetched independently by `useSuperAdmin`, `useSubscription`, `ProtectedRoute`
 * and `StorefrontRoot`. Each of those hooks/components ran its own queries on
 * every render, which produced an infinite request loop and made UI state
 * (like opening dialogs) get discarded.
 *
 * This provider runs each query exactly once per signed-in user and exposes
 * the results via context.
 */

export type SessionExtras = {
  isSuperAdmin: boolean;
  isOrgMember: boolean;
  subscription: {
    expiresAt: Date | null;
    hasSubscription: boolean;
    isExpired: boolean;
    daysRemaining: number | null;
  };
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultValue: SessionExtras = {
  isSuperAdmin: false,
  isOrgMember: false,
  subscription: {
    expiresAt: null,
    hasSubscription: false,
    isExpired: false,
    daysRemaining: null,
  },
  loading: true,
  refresh: async () => {},
};

const SessionContext = createContext<SessionExtras>(defaultValue);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<Omit<SessionExtras, "refresh">>(defaultValue);

  const load = async () => {
    if (!user) {
      setState({
        isSuperAdmin: false,
        isOrgMember: false,
        subscription: defaultValue.subscription,
        loading: false,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true }));

    const [saRes, memRes, subRes] = await Promise.all([
      supabase.from("super_admins").select("id").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("customer_subscriptions")
        .select("expires_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    let isSuperAdmin = !!saRes.data;

    // Bootstrap from allow-list if needed
    if (!isSuperAdmin) {
      const email = (user.email ?? "").toLowerCase();
      if (SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
        try {
          await supabase.functions.invoke("admin-bootstrap-superadmin");
          const { data: re } = await supabase
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          isSuperAdmin = !!re;
        } catch {
          /* ignore */
        }
      }
    }

    const isOrgMember = !!memRes.data;

    let sub = defaultValue.subscription;
    if (subRes.data?.expires_at) {
      const exp = new Date(subRes.data.expires_at);
      const ms = exp.getTime() - Date.now();
      sub = {
        expiresAt: exp,
        hasSubscription: true,
        isExpired: ms <= 0,
        daysRemaining: Math.ceil(ms / (1000 * 60 * 60 * 24)),
      };
    }

    setState({
      isSuperAdmin,
      isOrgMember,
      subscription: sub,
      loading: false,
    });
  };

  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return (
    <SessionContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}