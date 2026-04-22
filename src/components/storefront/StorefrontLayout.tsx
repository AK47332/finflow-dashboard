import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontFooter } from "./StorefrontFooter";
import type { EcomCategory } from "@/lib/ecom";

type Props = {
  orgId: string;
  storeName: string;
  storeLogoUrl?: string | null;
  children: ReactNode;
};

export function StorefrontLayout({ orgId, storeName, storeLogoUrl, children }: Props) {
  const [categories, setCategories] = useState<EcomCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("ecom_categories")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      setCategories((data as EcomCategory[]) ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="storefront-theme flex min-h-screen flex-col bg-background text-foreground">
      <StorefrontHeader
        orgId={orgId}
        storeName={storeName}
        storeLogoUrl={storeLogoUrl}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
      />
      <main className="flex-1">{children}</main>
      <StorefrontFooter storeName={storeName} orgId={orgId} />
    </div>
  );
}