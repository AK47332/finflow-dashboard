import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import type { EcomCategory, StorefrontProduct } from "@/lib/ecom";

export function StorefrontShop({ orgId }: { orgId: string }) {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<EcomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") ?? "";
  const categorySlug = params.get("category");
  const featuredOnly = params.get("featured") === "1";
  const [sort, setSort] = useState<string>("newest");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [extrasRes, catRes] = await Promise.all([
        supabase
          .from("ecom_product_extras")
          .select("*, product:products(*)")
          .eq("organization_id", orgId)
          .eq("is_published", true),
        supabase
          .from("ecom_categories")
          .select("*")
          .eq("organization_id", orgId)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (cancelled) return;
      const list: StorefrontProduct[] = (extrasRes.data ?? [])
        .filter((r: any) => r.product)
        .map((r: any) => ({
          ...r.product,
          extras: {
            product_id: r.product_id,
            organization_id: r.organization_id,
            ecom_category_id: r.ecom_category_id,
            is_published: r.is_published,
            is_featured: r.is_featured,
            is_trending: r.is_trending,
            short_description: r.short_description,
            long_description: r.long_description,
            compare_at_price: r.compare_at_price,
            image_urls: r.image_urls ?? [],
            tags: r.tags ?? [],
            slug: r.slug,
          },
        }));
      setProducts(list);
      setCategories((catRes.data as EcomCategory[]) ?? []);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.extras?.tags ?? []).some((t) => t.toLowerCase().includes(lower)),
      );
    }
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) list = list.filter((p) => p.extras?.ecom_category_id === cat.id);
    }
    if (featuredOnly) list = list.filter((p) => p.extras?.is_featured);
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, q, categorySlug, featuredOnly, sort, categories]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {categorySlug
              ? categories.find((c) => c.slug === categorySlug)?.name ?? "Shop"
              : featuredOnly
              ? "Featured"
              : "All products"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={q}
              placeholder="Search"
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value;
                  const np = new URLSearchParams(params);
                  if (v) np.set("q", v);
                  else np.delete("q");
                  setParams(np);
                }
              }}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="hidden md:block">
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" /> Categories
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    const np = new URLSearchParams(params);
                    np.delete("category");
                    setParams(np);
                  }}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${!categorySlug ? "bg-muted font-semibold" : ""}`}
                >
                  All
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      const np = new URLSearchParams(params);
                      np.set("category", c.slug);
                      setParams(np);
                    }}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${categorySlug === c.slug ? "bg-muted font-semibold" : ""}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No products found.</p>
            <Button variant="outline" className="mt-4" onClick={() => setParams(new URLSearchParams())}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}