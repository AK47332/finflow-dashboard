import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FrontendSettings } from "@/lib/ecom";

const DEFAULTS = (orgId: string): FrontendSettings => ({
  organization_id: orgId,
  mode: "private",
  is_primary: false,
  store_name: null,
  store_tagline: null,
  store_logo_url: null,
  footer_logo_url: null,
  hero_title: null,
  hero_subtitle: null,
  hero_image_url: null,
  hero_cta_label: null,
  hero_cta_url: null,
});

export function useFrontendSettings(orgId: string | null) {
  const [settings, setSettings] = useState<FrontendSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("org_frontend_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();
    setSettings((data as FrontendSettings | null) ?? DEFAULTS(orgId));
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { settings, loading, reload: load };
}