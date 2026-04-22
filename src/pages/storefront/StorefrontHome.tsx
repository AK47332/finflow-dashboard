import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Sparkles,
  Headphones,
  RotateCcw,
  Lock,
  Award,
} from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CategoryBento } from "@/components/storefront/CategoryBento";
import { NewsletterStrip } from "@/components/storefront/NewsletterStrip";
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
  const [latest, setLatest] = useState<StorefrontProduct[]>([]);
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
      setLatest(
        [...products]
          .sort((a, b) => (b.id > a.id ? 1 : -1))
          .slice(0, 8),
      );
      setCategories((catRes.data as EcomCategory[]) ?? []);
      setBanners((banRes.data as EcomBanner[]) ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const heroTitle = settings.hero_title ?? `Style worth\nliving in.`;
  const heroSubtitle =
    settings.hero_subtitle ??
    "Discover the season's best — handpicked, considered, and made to last.";
  const heroProduct = trending[0] ?? featured[0] ?? latest[0] ?? null;
  const heroImg = heroProduct?.extras?.image_urls?.[0];

  return (
    <div>
      {/* HERO — magazine style */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto grid items-center gap-10 px-4 py-14 md:grid-cols-12 md:gap-8 md:py-24">
          <div className="md:col-span-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" />
              {settings.store_tagline ?? "Spring Collection 2026"}
            </div>
            <h1 className="whitespace-pre-line font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-sm">
                <Link to={settings.hero_cta_url ?? "/shop"}>
                  {settings.hero_cta_label ?? "Shop now"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-sm">
                <Link to="/shop?featured=1">Browse featured</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" /> Quality first
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-primary" /> Free shipping $50+
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-primary" /> 30-day returns
              </div>
            </div>
          </div>

          <div className="relative md:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 to-accent/20 shadow-lift">
              {settings.hero_image_url || heroImg ? (
                <img
                  src={settings.hero_image_url ?? heroImg!}
                  alt="Hero"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl font-bold text-primary/30">
                  {(settings.store_name ?? "S")[0]}
                </div>
              )}
              {heroProduct && (
                <Link
                  to={`/product/${heroProduct.extras?.slug}`}
                  className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl bg-background/95 p-3 shadow-xl backdrop-blur transition-transform hover:-translate-y-0.5 md:bottom-6 md:left-auto md:right-6 md:max-w-[260px]"
                >
                  {heroProduct.extras?.image_urls?.[0] && (
                    <img
                      src={heroProduct.extras.image_urls[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Trending
                    </div>
                    <div className="line-clamp-1 text-sm font-semibold">
                      {heroProduct.name}
                    </div>
                    <div className="mt-0.5 text-sm font-bold">
                      ${Number(heroProduct.price).toFixed(2)}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
            </div>
            {/* decorative blob */}
            <div className="pointer-events-none absolute -right-10 -top-10 -z-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 -z-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <section className="border-b border-border/60 bg-foreground text-background">
        <div className="container mx-auto flex flex-wrap items-center justify-around gap-x-8 gap-y-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-2"><Truck className="h-3.5 w-3.5" /> Free shipping over $50</span>
          <span className="hidden h-3 w-px bg-background/30 sm:block" />
          <span className="flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" /> 30-day returns</span>
          <span className="hidden h-3 w-px bg-background/30 sm:block" />
          <span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Secure payment</span>
          <span className="hidden h-3 w-px bg-background/30 sm:block" />
          <span className="flex items-center gap-2"><Headphones className="h-3.5 w-3.5" /> 24/7 support</span>
        </div>
      </section>

      {/* Categories — bento */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <SectionHeader title="Shop by category" subtitle="Find your next favorite piece" link="/shop" />
          <CategoryBento categories={categories} />
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <SectionHeader title="Trending now" subtitle="What everyone's loving this week" link="/shop" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {trending.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Promo split-banner */}
      {banners[0] && (
        <section className="container mx-auto px-4 py-8">
          <div className="relative grid overflow-hidden rounded-[2rem] bg-foreground md:grid-cols-2">
            <div className="relative aspect-[4/3] md:aspect-auto">
              {banners[0].image_url && (
                <img
                  src={banners[0].image_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 to-transparent md:bg-gradient-to-r md:from-transparent md:to-foreground/40" />
            </div>
            <div className="flex flex-col justify-center gap-4 p-8 text-background md:p-14">
              <div className="inline-flex items-center gap-2 self-start rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                Limited time
              </div>
              <h2 className="font-serif text-3xl font-bold leading-tight md:text-5xl">
                {banners[0].title}
              </h2>
              {banners[0].subtitle && (
                <p className="max-w-md text-sm text-background/80 md:text-base">
                  {banners[0].subtitle}
                </p>
              )}
              {banners[0].cta_label && banners[0].cta_url && (
                <Button asChild size="lg" variant="secondary" className="mt-2 h-12 w-fit px-7">
                  <Link to={banners[0].cta_url}>
                    {banners[0].cta_label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals — horizontal scroll on mobile */}
      {latest.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <SectionHeader title="New arrivals" subtitle="Fresh from the workshop" link="/shop?category=new-arrivals" />
          <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-4">
              {latest.slice(0, 8).map((p) => (
                <div key={p.id} className="w-[68vw] shrink-0 sm:w-[42vw] md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-14">
          <SectionHeader title="Featured products" subtitle="Editor's picks for the season" link="/shop?featured=1" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Why shop with us */}
      <section className="container mx-auto px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              Icon: Award,
              title: "Crafted to last",
              desc: "Premium materials, considered details, built for everyday wear.",
            },
            {
              Icon: ShieldCheck,
              title: "Buy with confidence",
              desc: "Secure checkout, verified vendors, transparent pricing.",
            },
            {
              Icon: Headphones,
              title: "Real human support",
              desc: "Questions? Our team replies within hours, every day.",
            },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/60 bg-card p-6 transition-shadow hover:shadow-lift"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-base font-semibold">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterStrip />

      {trending.length === 0 && featured.length === 0 && latest.length === 0 && (
        <section className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">
            No products published yet. Add and publish products from Ecommerce Management.
          </p>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  link,
}: {
  title: string;
  subtitle?: string;
  link: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <Link
        to={link}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        View all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
