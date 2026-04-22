import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FrontendSettings } from "@/lib/ecom";

/**
 * Resolves which org's storefront should serve the public root.
 * Picks the org marked is_primary=true (any mode). If none, returns null.
 */
export function usePublicStorefront() {
  const [settings, setSettings] = useState<FrontendSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("org_frontend_settings")
        .select("*")
        .eq("is_primary", true)
        .maybeSingle();
      if (cancelled) return;
      setSettings((data as FrontendSettings | null) ?? null);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}