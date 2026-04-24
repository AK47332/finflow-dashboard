import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FrontendSettings } from "@/lib/ecom";
import { setActiveCurrency } from "@/lib/format";

/**
 * Resolves which org's storefront should serve the public root.
 * If `slug` is provided, that org's settings are returned (any mode is
 * coerced to ecommerce so the storefront renders). Otherwise:
 *   1. The org explicitly marked is_primary=true (any mode).
 *   2. The first org that has mode='ecommerce'.
 *   3. The first organization in the system, with a synthesized
 *      ecommerce settings record (so visitors always see a storefront).
 */
export function usePublicStorefront(slug?: string | null) {
  const [settings, setSettings] = useState<FrontendSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    async function applyOrgCurrency(orgId: string) {
      const { data: org } = await supabase
        .from("organizations")
        .select("currency")
        .eq("id", orgId)
        .maybeSingle();
      if (cancelled) return;
      setActiveCurrency(org?.currency ?? "USD");
    }
    async function load() {
      // 0. Slug-based lookup wins.
      if (slug) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id, name, currency")
          .ilike("slug", slug)
          .maybeSingle();
        if (cancelled) return;
        if (!org) {
          setSettings(null);
          setNotFound(true);
          setLoading(false);
          return;
        }
        const { data: fs } = await supabase
          .from("org_frontend_settings")
          .select("*")
          .eq("organization_id", org.id)
          .maybeSingle();
        if (cancelled) return;
        setActiveCurrency((org as any).currency ?? "USD");
        if (fs) {
          // Force ecommerce mode for /<slug>/* so the storefront always renders.
          setSettings({ ...(fs as FrontendSettings), mode: "ecommerce" });
        } else {
          setSettings({
            organization_id: org.id,
            mode: "ecommerce",
            is_primary: false,
            store_name: org.name,
            store_tagline: null,
            store_logo_url: null,
            footer_logo_url: null,
            hero_title: null,
            hero_subtitle: null,
            hero_image_url: null,
            hero_cta_label: null,
            hero_cta_url: null,
            theme_primary_color: null,
            theme_accent_color: null,
            updated_at: new Date().toISOString(),
            updated_by: null,
          } as FrontendSettings);
        }
        setLoading(false);
        return;
      }
      // 1. Primary org
      const primary = await supabase
        .from("org_frontend_settings")
        .select("*")
        .eq("is_primary", true)
        .maybeSingle();
      if (cancelled) return;
      if (primary.data) {
        setSettings(primary.data as FrontendSettings);
        await applyOrgCurrency((primary.data as FrontendSettings).organization_id);
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
        await applyOrgCurrency((ecom.data as FrontendSettings).organization_id);
        setLoading(false);
        return;
      }
      // 3. Fallback to first organization, synthesize ecommerce settings.
      const org = await supabase
        .from("organizations")
        .select("id, name, currency")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (org.data) {
        setActiveCurrency((org.data as any).currency ?? "USD");
        setSettings({
          organization_id: org.data.id,
          mode: "ecommerce",
          is_primary: false,
          store_name: org.data.name,
          store_tagline: null,
          store_logo_url: null,
          footer_logo_url: null,
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
  }, [slug]);

  return { settings, loading, notFound };
}