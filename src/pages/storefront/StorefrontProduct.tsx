import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Heart,
  Share2,
  Star,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductTabs } from "@/components/storefront/ProductTabs";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import type { StorefrontProduct as SP, EcomCategory } from "@/lib/ecom";

const SIZE_LIKE = /^(xxs|xs|s|m|l|xl|xxl|xxxl|\d{1,2})$/i;

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
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setLoading(true);
      setActiveImg(0);
      setQty(1);
      setActiveSize(null);
      setActiveColor(null);
      const { data: extras } = await supabase
        .from("ecom_product_extras")
        .select("*, product:products(*)")
        .eq("organization_id", orgId)
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!extras || !(extras as any).product) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const e: any = extras;
      const p: SP = {
        ...e.product,
        extras: {
          product_id: e.product_id,
          organization_id: e.organization_id,
          ecom_category_id: e.ecom_category_id,
          is_published: e.is_published,
          is_featured: e.is_featured,
          is_trending: e.is_trending,
          short_description: e.short_description,
          long_description: e.long_description,
          compare_at_price: e.compare_at_price,
          image_urls: e.image_urls ?? [],
          tags: e.tags ?? [],
          slug: e.slug,
        },
      };
      setProduct(p);

      // Category
      if (e.ecom_category_id) {
        const { data: cat } = await supabase
          .from("ecom_categories")
          .select("*")
          .eq("id", e.ecom_category_id)
          .maybeSingle();
        if (!cancelled) setCategory((cat as EcomCategory) ?? null);
      } else {
        setCategory(null);
      }

      // Related
      const { data: relExtras } = await supabase
        .from("ecom_product_extras")
        .select("*, product:products(*)")
        .eq("organization_id", orgId)
        .eq("is_published", true)
        .neq("product_id", p.id)
        .limit(4);
      const rel: SP[] = (relExtras ?? [])
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
      setRelated(rel);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId, slug]);

  const { sizes, colors } = useMemo(() => {
    const tags = product?.extras?.tags ?? [];
    const sz = tags.filter((t) => SIZE_LIKE.test(t.trim()));
    const cl = tags.filter((t) => !SIZE_LIKE.test(t.trim()));
    return {
      sizes: sz.length ? sz : ["S", "M", "L"],
      colors: cl.length ? cl : ["Black", "Sand", "Olive"],
    };
  }, [product]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const images = product.extras?.image_urls?.length ? product.extras.image_urls : [];
  const compareAt = product.extras?.compare_at_price ?? null;
  const showCompare = compareAt && compareAt > product.price;
  const discount = showCompare
    ? Math.round(((compareAt! - product.price) / compareAt!) * 100)
    : 0;

  const onAddToCart = () => {
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      unit_price: Number(product.price),
      image_url: images[0] ?? null,
      quantity: qty,
      organization_id: product.organization_id,
    });
    toast.success(`Added ${qty} × ${product.name}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/shop?category=${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="line-clamp-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-12 md:gap-12">
        {/* GALLERY */}
        <div className="md:col-span-7">
          <div className="flex gap-3">
            {/* Vertical thumbs (desktop) */}
            {images.length > 1 && (
              <div className="hidden flex-col gap-2 md:flex">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "h-20 w-20 overflow-hidden rounded-xl border-2 transition-all",
                      activeImg === i
                        ? "border-foreground"
                        : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
              {discount > 0 && (
                <span className="absolute left-4 top-4 rounded-md bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
                  Save {discount}%
                </span>
              )}
              {product.extras?.is_trending && (
                <span className="absolute right-4 top-4 rounded-md bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
                  Trending
                </span>
              )}
            </div>
          </div>

          {/* Horizontal thumbs (mobile) */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto md:hidden">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    activeImg === i
                      ? "border-foreground"
                      : "border-transparent opacity-60",
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="md:col-span-5">
          {category && (
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              {category.name}
            </div>
          )}
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {product.name}
          </h1>

          {/* Reviews stub */}
          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">4.8 · 24 reviews</span>
          </div>

          {/* Price */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">${Number(product.price).toFixed(2)}</span>
            {showCompare && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  ${Number(compareAt).toFixed(2)}
                </span>
                <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          {product.extras?.short_description && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.extras.short_description}
            </p>
          )}

          <div className="my-6 h-px bg-border/60" />

          {/* Size */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider">Size</span>
              <button className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                Size guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSize(s)}
                  className={cn(
                    "min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    activeSize === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/60 hover:border-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Color</span>
              {activeColor && (
                <span className="text-xs text-muted-foreground">— {activeColor}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    activeColor === c
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/60 hover:border-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-xl border border-border/60">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-muted"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 hover:bg-muted"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              onClick={onAddToCart}
              disabled={product.stock <= 0}
              className="h-12 flex-1 px-7 text-sm md:flex-none md:min-w-[200px]"
            >
              <ShoppingBag className="h-4 w-4" />
              {product.stock > 0 ? "Add to cart" : "Sold out"}
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-12 p-0" aria-label="Save">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 w-12 p-0" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock pill */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {product.stock > 0
              ? `${Number(product.stock)} in stock — ships in 24h`
              : "Currently out of stock"}
          </div>

          {/* Trust strip */}
          <div className="mt-7 grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Free shipping over $50
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" /> 30-day returns
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure checkout
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Quality guaranteed
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ProductTabs product={product} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky add-to-cart on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-xs font-medium">{product.name}</div>
            <div className="text-base font-bold">${Number(product.price).toFixed(2)}</div>
          </div>
          <Button
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className="h-11 px-5"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </Button>
        </div>
      </div>
      <div className="h-20 md:hidden" />
    </div>
  );
}
