import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CategoryPills } from "@/components/storefront/CategoryPills";
import { InstagramGrid } from "@/components/storefront/InstagramGrid";
import { cn } from "@/lib/utils";
import type {
  EcomBanner,
  EcomCategory,
  FrontendSettings,
  StorefrontProduct,
} from "@/lib/ecom";

type Props = { orgId: string; settings: FrontendSettings };
type Filter = "all" | "featured" | "trending" | "sale" | "stock";

export function StorefrontHome({ orgId, settings }: Props) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<EcomCategory[]>([]);
  const [banners, setBanners] = useState<EcomBanner[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [extrasRes, catRes, banRes] = await Promise.all([
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
        supabase
          .from("ecom_banners")
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
      setBanners((banRes.data as EcomBanner[]) ?? []);
    }
    void load();
    return () => { cancelled = true; };
  }, [orgId]);

  const trending = useMemo(() => products.filter((p) => p.extras?.is_trending), [products]);
  const featured = useMemo(() => products.filter((p) => p.extras?.is_featured), [products]);
  const onSale = useMemo(
    () => products.filter((p) => p.extras?.compare_at_price && p.extras.compare_at_price > p.price),
    [products],
  );
  const inStock = useMemo(() => products.filter((p) => p.stock > 0), [products]);

  const visible = useMemo(() => {
    switch (filter) {
      case "featured": return featured;
      case "trending": return trending;
      case "sale": return onSale;
      case "stock": return inStock;
      default: return products;
    }
  }, [filter, products, featured, trending, onSale, inStock]);

  const heroBanner = banners.find((b) => b.position === "hero") ?? banners[0];
  const promoBanner = banners.find((b) => b.position === "promo");
  const heroTitle = heroBanner?.title ?? settings.hero_title ?? "Baraati Edit 2024";
  const heroSubtitle = heroBanner?.subtitle ?? settings.hero_subtitle ??
    "Festive ready-to-wear for the season's most special days.";
  const heroImage = heroBanner?.image_url ?? settings.hero_image_url ??
    "https://images.unsplash.com/photo-1610189025214-7b4f60a25dab?w=1600&auto=format&fit=crop";
  const heroCtaLabel = heroBanner?.cta_label ?? settings.hero_cta_label ?? "Shop the edit";
  const heroCtaUrl = heroBanner?.cta_url ?? settings.hero_cta_url ?? "/shop";

  return (
    <div>
      {/* HERO — cinematic */}
      <section className="relative overflow-hidden">
        <div className="relative h-[78vh] min-h-[560px] w-full">
          <img
            src={heroImage}
            alt={heroTitle}
            className="absolute inset-0 h-full w-full animate-slow-zoom object-cover"
          />
          <div
            className="hero-gradient-shimmer absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, hsl(350 60% 14% / 0.85), hsl(158 50% 12% / 0.55) 50%, hsl(230 50% 12% / 0.80))",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />

          <div className="relative container mx-auto flex h-full items-center px-4">
            <div className="max-w-2xl text-background">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gold backdrop-blur">
                <Sparkles className="h-3 w-3" /> Festival Collection
              </div>
              <h1 className="font-serif-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl lg:text-8xl">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-background/85 md:text-lg">
                {heroSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full bg-gold px-8 text-xs font-bold uppercase tracking-[0.18em] text-charcoal shadow-gold transition-transform hover:scale-[1.03] hover:bg-gold"
                >
                  <Link to={heroCtaUrl}>
                    {heroCtaLabel} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-background/40 bg-background/5 px-8 text-xs font-bold uppercase tracking-[0.18em] text-background backdrop-blur hover:bg-background hover:text-foreground"
                >
                  <Link to="/shop">Browse all</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      {categories.length > 0 && (
        <section className="border-b border-border/60 bg-background">
          <div className="container mx-auto px-4">
            <CategoryPills categories={categories} />
          </div>
        </section>
      )}

      {/* Filterable product grid */}
      {products.length > 0 && (
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col items-center text-center">
            <h2 className="heading-underline-center font-serif-display text-3xl font-bold md:text-4xl">
              Shop our edit
            </h2>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Hand-picked, slow-made, always in season.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-soft">
              {([
                ["all", "All"],
                ["featured", "Featured"],
                ["trending", "Trending"],
                ["sale", "On Sale"],
                ["stock", "In Stock"],
              ] as [Filter, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                    filter === k
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visible.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/shop">View all <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      )}

      {/* Single banner full width if available */}
      {promoBanner && (
        <section className="container mx-auto px-4 py-16">
          <div className="relative grid overflow-hidden rounded-[2rem] bg-charcoal md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto">
              {promoBanner.image_url && (
                <img src={promoBanner.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-charcoal/40" />
            </div>
            <div className="flex flex-col justify-center gap-4 p-8 text-background md:p-14">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-gold/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                Limited edition
              </div>
              <h2 className="font-serif-display text-3xl font-bold leading-tight md:text-5xl">
                {promoBanner.title}
              </h2>
              {promoBanner.subtitle && (
                <p className="max-w-md text-sm text-background/80 md:text-base">{promoBanner.subtitle}</p>
              )}
              {promoBanner.cta_label && promoBanner.cta_url && (
                <Button
                  asChild
                  size="lg"
                  className="mt-2 h-12 w-fit rounded-full bg-gold px-8 text-xs font-bold uppercase tracking-[0.18em] text-charcoal hover:bg-gold/90"
                >
                  <Link to={promoBanner.cta_url}>
                    {promoBanner.cta_label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Instagram */}
      <InstagramGrid orgId={orgId} />

      {products.length === 0 && (
        <section className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">
            No products published yet. Add them from Ecommerce Management.
          </p>
        </section>
      )}
    </div>
  );
}
