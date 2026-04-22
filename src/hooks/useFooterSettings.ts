import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FooterSettings = {
  copyright_text: string;
  contact_text: string;
  contact_button_label: string;
  contact_button_url: string;
};

export const DEFAULT_FOOTER: FooterSettings = {
  copyright_text: `© ${new Date().getFullYear()} FinTrack Pro. All rights reserved.`,
  contact_text: "Need help?",
  contact_button_label: "Contact us",
  contact_button_url: "mailto:support@example.com",
};

export function useFooterSettings(orgId: string | null) {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) {
      setSettings(DEFAULT_FOOTER);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("org_footer_settings")
      .select("copyright_text, contact_text, contact_button_label, contact_button_url")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (data) {
      setSettings({
        copyright_text: data.copyright_text ?? DEFAULT_FOOTER.copyright_text,
        contact_text: data.contact_text ?? DEFAULT_FOOTER.contact_text,
        contact_button_label: data.contact_button_label ?? DEFAULT_FOOTER.contact_button_label,
        contact_button_url: data.contact_button_url ?? DEFAULT_FOOTER.contact_button_url,
      });
    } else {
      setSettings(DEFAULT_FOOTER);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { settings, loading, reload: load };
}