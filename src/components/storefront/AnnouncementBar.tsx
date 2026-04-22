import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EcomAnnouncement } from "@/lib/ecom";

const FALLBACK = [
  { icon: "✦", text: "50% OFF on Festival Collection" },
  { icon: "✦", text: "Free Shipping above ₹999" },
  { icon: "✦", text: "New Arrivals Weekly" },
];

export function AnnouncementBar({ orgId }: { orgId?: string | null }) {
  const [items, setItems] = useState<{ icon: string; text: string }[]>(FALLBACK);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ecom_announcements")
        .select("text, icon, sort_order, is_active")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("sort_order");
      if (cancelled) return;
      const list = (data as EcomAnnouncement[] | null) ?? [];
      if (list.length > 0) {
        setItems(list.map((a) => ({ icon: a.icon || "✦", text: a.text })));
      }
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  // Duplicate for seamless loop
  const looped = [...items, ...items];
  return (
    <div className="bg-gradient-charcoal-gold text-background">
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-2.5 text-[11px] font-medium uppercase tracking-[0.18em]">
          {looped.map((t, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-3">
              <span><span className="mr-2 text-gold">{t.icon}</span>{t.text}</span>
              <span className="text-gold">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
