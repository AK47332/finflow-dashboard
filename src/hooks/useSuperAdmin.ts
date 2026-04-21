import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUPER_ADMIN_EMAILS } from "@/lib/superAdminConfig";

export function useSuperAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (authLoading) return;
      if (!user) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      if (data) {
        setIsSuperAdmin(true);
        setLoading(false);
        return;
      }

      // Try bootstrap from allow-list
      const email = (user.email ?? "").toLowerCase();
      if (SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
        try {
          await supabase.functions.invoke("admin-bootstrap-superadmin");
          const { data: re } = await supabase
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!cancelled) setIsSuperAdmin(!!re);
        } catch {
          if (!cancelled) setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
      if (!cancelled) setLoading(false);
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isSuperAdmin, loading };
}