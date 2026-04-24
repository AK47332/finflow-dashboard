import { useStoreLink } from "@/contexts/StorefrontBasePath";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Minus, Plus, ShoppingBag, Truck, ShieldCheck, Heart, Share2, Star,
  RotateCcw, CheckCircle2, ChevronRight, Ruler, Eye, Clock, Facebook,
  Twitter, Instagram, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductTabs } from "@/components/storefront/ProductTabs";
import { CountdownTimer } from "@/components/storefront/CountdownTimer";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import type { StorefrontProduct as SP, EcomCategory } from "@/lib/ecom";
import { currency } from "@/lib/format";

const SIZE_LIKE = /^(xxs|xs|s|m|l|xl|xxl|xxxl|free|custom|\d{1,2}y?)$/i;

export function StorefrontProduct({ orgId }: { orgId: string }) {
  const { slug } = useParams();
  const [product, setProduct] = useState<SP | null>(null);
  const [related, setRelated] = useState<SP[]>([]);
  const [category, setCategory] = useState<EcomCategory | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [wished, setWished] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  // Countdown end time — 1 day, 6 hours from page mount (stable per product)
  const endsAt = useMemo(() => new Date(Date.now() + (24 * 60 * 60 * 1000) + (6 * 60 * 60 * 1000)), [slug]);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    async function load() {
      if (!slug) return;
      setLoading(true);
      setActiveImg(0); setQty(1); setActiveSize(null); setActiveColor(null);
      const { data: extras } = await supabase
        .from("ecom_product_extras")
        .select("*, product:products(*)")
        .eq("organization_id", orgId)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!extras || !(extras as any).product) {
        setProduct(null); setLoading(false); return;
      }
      const e: any = extras;
      const p: SP = {
        ...e.product,
        extras: {
          product_id: e.product_id, organization_id: e.organization_id,
          ecom_category_id: e.ecom_category_id, is_published: e.is_published,
          is_featured: e.is_featured, is_trending: e.is_trending,
          short_description: e.short_description, long_description: e.long_description,
          compare_at_price: e.compare_at_price, image_urls: e.image_urls ?? [],
          tags: e.tags ?? [], slug: e.slug,
        },
      };
      setProduct(p);

      if (e.ecom_category_id) {
        const { data: cat } = await supabase.from("ecom_categories").select("*").eq("id", e.ecom_category_id).maybeSingle();
        if (!cancelled) setCategory((cat as EcomCategory) ?? null);
      } else { setCategory(null); }

      const { data: relExtras } = await supabase
        .from("ecom_product_extras").select("*, product:products(*)")
        .eq("organization_id", orgId).eq("is_published", true)
        .neq("product_id", p.id).limit(8);
      const rel: SP[] = (relExtras ?? []).filter((r: any) => r.product).map((r: any) => ({
        ...r.product,
        extras: {
          product_id: r.product_id, organization_id: r.organization_id,
          ecom_category_id: r.ecom_category_id, is_published: r.is_published,
          is_featured: r.is_featured, is_trending: r.is_trending,
          short_description: r.short_description, long_description: r.long_description,
          compare_at_price: r.compare_at_price, image_urls: r.image_urls ?? [],
          tags: r.tags ?? [], slug: r.slug,
        },
      }));
      setRelated(rel); setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [orgId, slug]);

  const { sizes, colors } = useMemo(() => {
    const tags = product?.extras?.tags ?? [];
    const sz = tags.filter((t) => SIZE_LIKE.test(t.trim()));
    const cl = tags.filter((t) => !SIZE_LIKE.test(t.trim()));
    return {
      sizes: sz.length ? sz : ["S", "M", "L"],
      colors: cl.length ? cl : ["Maroon", "Ivory", "Emerald"],
    };
  }, [product]);

  if (loading) {
    return (
      <div className="container mx-auto grid gap-10 px-4 py-10 md:grid-cols-2">
        <div className="aspect-[4/5] skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="h-6 w-1/2 skeleton rounded" />
          <div className="h-10 w-3/4 skeleton rounded" />
          <div className="h-5 w-1/3 skeleton rounded" />
          <div className="h-32 skeleton rounded" />
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to={storeLink("/shop")}>Back to shop</Link></Button>
      </div>
    );
  }

  const images = product.extras?.image_urls?.length ? product.extras.image_urls : [];
  const compareAt = product.extras?.compare_at_price ?? null;
  const showCompare = compareAt && compareAt > product.price;
  const discount = showCompare ? Math.round(((compareAt! - product.price) / compareAt!) * 100) : 0;
  const stockNum = Number(product.stock) || 0;
  const ordered = Math.max(1, Math.floor(stockNum * 0.15));
  const stockPct = stockNum > 0 ? Math.min(100, Math.max(8, (ordered / (ordered + stockNum)) * 100)) : 0;

  const onAddToCart = () => {
    addItem({
      product_id: product.id, name: product.name, sku: product.sku,
      unit_price: Number(product.price), image_url: images[0] ?? null,
      quantity: qty, organization_id: product.organization_id,
    });
    toast.success(`Added ${qty} × ${product.name}`);
  };

  const fmt = (n: number) => currency(n);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={storeLink("/shop")} className="hover:text-foreground">Shop</Link>
        {category && (<>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/shop?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link>
        </>)}
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        {/* GALLERY */}
        <div className="md:col-span-7">
          <div className="flex gap-3">
            {images.length > 1 && (
              <div className="hidden flex-col gap-2 md:flex">
                {images.map((img, i) => (
                  <button key={img + i} onClick={() => setActiveImg(i)}
                    className={cn(
                      "h-20 w-20 overflow-hidden rounded-xl border-2 transition-all",
                      activeImg === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100",
                    )}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
              {images[activeImg] ? (
                <img key={images[activeImg]} src={images[activeImg]} alt={product.name}
                  className="h-full w-full animate-fade-in object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  -{discount}% OFF
                </span>
              )}
              {product.extras?.is_trending && (
                <span className="absolute right-4 top-4 rounded-full bg-charcoal px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-md">
                  Trending
                </span>
              )}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto md:hidden">
              {images.map((img, i) => (
                <button key={img + i} onClick={() => setActiveImg(i)}
                  className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                    activeImg === i ? "border-foreground" : "border-transparent opacity-60")}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="md:col-span-5">
          {category && (
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{category.name}</div>
          )}
          <h1 className="mt-2 font-serif-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex items-center">
              {[0,1,2,3,4].map((i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
            </div>
            <span className="text-xs text-muted-foreground">4.8 · 24 reviews</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{fmt(Number(product.price))}</span>
            {showCompare && (<>
              <span className="text-base text-muted-foreground line-through">{fmt(Number(compareAt))}</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                {stockNum} In Stock · Backorder OK
              </span>
            </>)}
          </div>

          {product.extras?.short_description && (
            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              {product.extras.short_description.split(/[.•]\s+/).filter(Boolean).slice(0, 4).map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                  <span>{line.trim()}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Countdown */}
          <div className="mt-6">
            <CountdownTimer endsAt={endsAt} />
          </div>

          {/* Stock progress */}
          {stockNum > 0 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">Ordered: <span className="text-foreground">{ordered}</span></span>
                <span className="text-muted-foreground">Items available: <span className="text-foreground">{stockNum}</span></span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${stockPct}%` }} />
              </div>
            </div>
          )}

          <div className="my-6 h-px bg-border/60" />

          {/* Size */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Size</span>
              <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline">
                <Ruler className="h-3 w-3" /> Size guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button key={s} onClick={() => setActiveSize(s)}
                  className={cn(
                    "min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    activeSize === s ? "border-foreground bg-foreground text-background"
                      : "border-border/60 hover:border-foreground",
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">Colour</span>
              {activeColor && <span className="text-xs text-muted-foreground">— {activeColor}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setActiveColor(c)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    activeColor === c ? "border-foreground bg-foreground text-background"
                      : "border-border/60 hover:border-foreground",
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Add to cart */}
          <div className="mt-6 flex flex-wrap items-stretch gap-3">
            <div className="flex h-12 items-center rounded-full border border-border/60 bg-card">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 hover:text-primary" aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-2 hover:text-primary" aria-label="Increase">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg" onClick={onAddToCart} disabled={stockNum <= 0}
              className="group h-12 flex-1 rounded-full bg-foreground px-7 text-xs font-bold uppercase tracking-[0.18em] text-background shadow-md transition-all hover:bg-primary hover:shadow-primary-glow md:flex-none md:min-w-[220px]"
            >
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
              {stockNum > 0 ? "Add to Cart" : "Sold out"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => { setWished(w => !w); toast.success(wished ? "Removed from wishlist" : "Added to wishlist"); }}
              className={cn("h-12 w-12 rounded-full p-0", wished && "border-primary text-primary")} aria-label="Wishlist">
              <Heart className={cn("h-4 w-4", wished && "fill-primary")} />
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-12 rounded-full p-0" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs md:grid-cols-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck className="h-5 w-5 text-gold" />
              <span className="font-semibold">Delivery & Return</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Ruler className="h-5 w-5 text-gold" />
              <span className="font-semibold">Size Guide</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Clock className="h-5 w-5 text-gold" />
              <span className="font-semibold">Apr 25–29</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Eye className="h-5 w-5 text-gold" />
              <span className="font-semibold">38 viewing</span>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 space-y-1 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">SKU:</span> {product.sku ?? "—"}</div>
            <div><span className="font-semibold text-foreground">Category:</span> {category?.name ?? "—"}</div>
            {product.extras?.tags && product.extras.tags.length > 0 && (
              <div><span className="font-semibold text-foreground">Tags:</span> {product.extras.tags.join(", ")}</div>
            )}
          </div>

          {/* Share */}
          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Share:</span>
            {[
              { Icon: Facebook, color: "bg-[#1877F2]" },
              { Icon: Twitter, color: "bg-[#1DA1F2]" },
              { Icon: Instagram, color: "bg-gradient-to-br from-[#feda77] to-[#dd2a7b]" },
              { Icon: Mail, color: "bg-gold" },
            ].map(({ Icon, color }, i) => (
              <a key={i} href="#" aria-label="Share"
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-110 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion tabs */}
      <ProductTabs product={product} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-underline font-serif-display text-2xl font-bold tracking-tight md:text-3xl">
            You may also like
          </h2>
          <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex gap-4 md:grid md:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <div key={p.id} className="w-[68vw] shrink-0 sm:w-[42vw] md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {related.length > 4 && (
        <section className="mt-12">
          <h2 className="heading-underline font-serif-display text-2xl font-bold tracking-tight md:text-3xl">
            Viewers also liked
          </h2>
          <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex gap-4 md:grid md:grid-cols-4">
              {related.slice(4, 8).map((p) => (
                <div key={p.id} className="w-[68vw] shrink-0 sm:w-[42vw] md:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mobile add-to-cart */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-xs font-medium">{product.name}</div>
            <div className="text-base font-bold text-primary">{fmt(Number(product.price))}</div>
          </div>
          <Button onClick={onAddToCart} disabled={stockNum <= 0}
            className="h-11 rounded-full bg-foreground px-5 text-xs font-bold uppercase tracking-wider text-background hover:bg-primary">
            <ShoppingBag className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  );
}
