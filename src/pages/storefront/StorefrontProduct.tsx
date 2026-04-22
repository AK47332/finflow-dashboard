import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Truck, ShieldCheck, Heart, Share2 } from "lucide-react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import type { StorefrontProduct as SP } from "@/lib/ecom";

export function StorefrontProduct({ orgId }: { orgId: string }) {
  const { slug } = useParams();
  const [product, setProduct] = useState<SP | null>(null);
  const [related, setRelated] = useState<SP[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setLoading(true);
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

      // related
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

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
        <Link to="/shop" className="hover:text-foreground">Shop</Link> / {product.name}
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded-xl border-2 transition-all ${activeImg === i ? "border-primary" : "border-transparent opacity-70"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.extras?.is_trending && (
            <span className="mb-3 inline-block rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Trending
            </span>
          )}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.name}</h1>
          {product.extras?.short_description && (
            <p className="mt-3 text-muted-foreground">{product.extras.short_description}</p>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {showCompare && (
              <span className="text-base text-muted-foreground line-through">${Number(compareAt).toFixed(2)}</span>
            )}
            <span className={`ml-2 text-xs font-semibold ${product.stock > 0 ? "text-emerald-600" : "text-destructive"}`}>
              {product.stock > 0 ? `${Number(product.stock)} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Qty + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-border/60">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-muted">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" onClick={onAddToCart} disabled={product.stock <= 0}>
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </Button>
            <Button size="lg" variant="outline" aria-label="Save">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Free shipping over $50
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Secure checkout
            </div>
          </div>

          {product.extras?.long_description && (
            <div className="mt-8">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {product.extras.long_description}
              </p>
            </div>
          )}

          {product.sku && (
            <div className="mt-6 text-xs text-muted-foreground">SKU: {product.sku}</div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}