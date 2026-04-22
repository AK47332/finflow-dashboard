import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FrontendSettings } from "@/lib/ecom";

/**
 * Resolves which org's storefront should serve the public root.
 * Resolution order:
 *   1. The org explicitly marked is_primary=true (any mode).
 *   2. The first org that has mode='ecommerce'.
 *   3. The first organization in the system, with a synthesized
 *      ecommerce settings record (so visitors always see a storefront).
 */
export function usePublicStorefront() {
  const [settings, setSettings] = useState<FrontendSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. Primary org
      const primary = await supabase
        .from("org_frontend_settings")
        .select("*")
        .eq("is_primary", true)
        .maybeSingle();
      if (cancelled) return;
      if (primary.data) {
        setSettings(primary.data as FrontendSettings);
        setLoading(false);
        return;
      }
      // 2. Any ecommerce-enabled org
      const ecom = await supabase
        .from("org_frontend_settings")
        .select("*")
        .eq("mode", "ecommerce")
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (ecom.data) {
        setSettings(ecom.data as FrontendSettings);
        setLoading(false);
        return;
      }
      // 3. Fallback to first organization, synthesize ecommerce settings.
      const org = await supabase
        .from("organizations")
        .select("id, name")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (org.data) {
        setSettings({
          organization_id: org.data.id,
          mode: "ecommerce",
          is_primary: false,
          store_name: org.data.name,
          store_tagline: null,
          store_logo_url: null,
          hero_title: null,
          hero_subtitle: null,
          hero_image_url: null,
          hero_cta_label: null,
          hero_cta_url: null,
          updated_at: new Date().toISOString(),
          updated_by: null,
        } as FrontendSettings);
      } else {
        setSettings(null);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}