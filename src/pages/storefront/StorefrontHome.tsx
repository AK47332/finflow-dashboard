import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, Sparkles, Headphones } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import type {
  EcomBanner,
  EcomCategory,
  FrontendSettings,
  StorefrontProduct,
} from "@/lib/ecom";

type Props = { orgId: string; settings: FrontendSettings };

export function StorefrontHome({ orgId, settings }: Props) {
  const [trending, setTrending] = useState<StorefrontProduct[]>([]);
  const [featured, setFeatured] = useState<StorefrontProduct[]>([]);
  const [categories, setCategories] = useState<EcomCategory[]>([]);
  const [banners, setBanners] = useState<EcomBanner[]>([]);

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
      const products: StorefrontProduct[] =
        (extrasRes.data ?? [])
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
      setTrending(products.filter((p) => p.extras?.is_trending).slice(0, 8));
      setFeatured(products.filter((p) => p.extras?.is_featured).slice(0, 8));
      setCategories((catRes.data as EcomCategory[]) ?? []);
      setBanners((banRes.data as EcomBanner[]) ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const heroTitle = settings.hero_title ?? `Welcome to ${settings.store_name ?? "our store"}`;
  const heroSubtitle =
    settings.hero_subtitle ?? "Discover the season's best — handpicked just for you.";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-accent/10">
        <div className="container mx-auto grid items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              {settings.store_tagline ?? "New Collection"}
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={settings.hero_cta_url ?? "/shop"}>
                  {settings.hero_cta_label ?? "Shop now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop?featured=1">View featured</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lift">
              {settings.hero_image_url ? (
                <img
                  src={settings.hero_image_url}
                  alt="Hero"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-6xl font-bold text-primary/30">
                  {(settings.store_name ?? "S")[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Promo strip */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4">
          {[
            { Icon: Truck, title: "Free shipping", desc: "On orders over $50" },
            { Icon: ShieldCheck, title: "Secure checkout", desc: "Safe & encrypted" },
            { Icon: Sparkles, title: "Top quality", desc: "Curated picks" },
            { Icon: Headphones, title: "24/7 support", desc: "We're here for you" },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <SectionHeader title="Shop by category" link="/shop" />
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to={`/shop?category=${c.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-muted/40 transition-all hover:shadow-lift"
              >
                <div className="aspect-square">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/10 text-xl font-bold text-primary/50">
                      {c.name[0]}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                  <div className="text-sm font-semibold text-background">{c.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <SectionHeader title="Trending now" link="/shop" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Banner */}
      {banners[0] && (
        <section className="container mx-auto px-4 py-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-8 md:p-12">
            {banners[0].image_url && (
              <img
                src={banners[0].image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30"
              />
            )}
            <div className="relative max-w-md">
              <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
                {banners[0].title}
              </h2>
              {banners[0].subtitle && (
                <p className="mt-2 text-sm text-primary-foreground/85">{banners[0].subtitle}</p>
              )}
              {banners[0].cta_label && banners[0].cta_url && (
                <Button asChild variant="secondary" className="mt-5">
                  <Link to={banners[0].cta_url}>{banners[0].cta_label}</Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <SectionHeader title="Featured products" link="/shop?featured=1" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {trending.length === 0 && featured.length === 0 && (
        <section className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">
            No products published yet. Add and publish products from Ecommerce Management.
          </p>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      <Link
        to={link}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}