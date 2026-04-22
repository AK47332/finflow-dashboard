import { useEffect, useState } from "react";
import { Heart, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { EcomInstagramPost } from "@/lib/ecom";

export function InstagramGrid({ orgId }: { orgId?: string | null }) {
  const [items, setItems] = useState<EcomInstagramPost[]>([]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ecom_instagram_posts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("sort_order");
      if (!cancelled) setItems((data as EcomInstagramPost[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Instagram className="h-3.5 w-3.5" /> @brownfox.couture
        </div>
        <h2 className="heading-underline-center font-serif-display text-3xl font-bold md:text-4xl">
          Follow our story
        </h2>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-8">
        {items.map((p) => (
          <a
            key={p.id}
            href={p.link_url ?? "#"}
            target={p.link_url ? "_blank" : undefined}
            rel={p.link_url ? "noopener noreferrer" : undefined}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
          >
            <img
              src={p.image_url}
              alt={p.caption ?? ""}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/0 text-background opacity-0 transition-all duration-300 group-hover:bg-foreground/55 group-hover:opacity-100">
              <Heart className="h-5 w-5 fill-background" />
              <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
