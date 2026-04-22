import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FooterSettings = {
  copyright_text: string;
  contact_text: string;
  contact_button_label: string;
  contact_button_url: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  youtube_url: string;
  payment_badges: string[];
};

export const DEFAULT_FOOTER: FooterSettings = {
  copyright_text: `© ${new Date().getFullYear()} FinTrack Pro. All rights reserved.`,
  contact_text: "Need help?",
  contact_button_label: "Contact us",
  contact_button_url: "mailto:support@example.com",
  description: "",
  address: "",
  phone: "",
  email: "",
  instagram_url: "",
  facebook_url: "",
  twitter_url: "",
  youtube_url: "",
  payment_badges: ["VISA", "MC", "AMEX"],
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
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();
    if (data) {
      setSettings({
        copyright_text: data.copyright_text ?? DEFAULT_FOOTER.copyright_text,
        contact_text: data.contact_text ?? DEFAULT_FOOTER.contact_text,
        contact_button_label: data.contact_button_label ?? DEFAULT_FOOTER.contact_button_label,
        contact_button_url: data.contact_button_url ?? DEFAULT_FOOTER.contact_button_url,
        description: data.description ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        instagram_url: data.instagram_url ?? "",
        facebook_url: data.facebook_url ?? "",
        twitter_url: data.twitter_url ?? "",
        youtube_url: data.youtube_url ?? "",
        payment_badges: (data.payment_badges as string[] | null) ?? DEFAULT_FOOTER.payment_badges,
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