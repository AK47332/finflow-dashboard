import { Link } from "react-router-dom";
import { ShoppingBag, Eye, Heart } from "lucide-react";
import { useState } from "react";
import type { StorefrontProduct } from "@/lib/ecom";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";
import { useStoreLink } from "@/contexts/StorefrontBasePath";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const storeLink = useStoreLink();
  const [wished, setWished] = useState(false);
  const slug = product.extras?.slug ?? product.id;
  const image = product.extras?.image_urls?.[0] ?? null;
  const hoverImage = product.extras?.image_urls?.[1] ?? null;
  const compareAt = product.extras?.compare_at_price ?? null;
  const showCompare = compareAt && compareAt > product.price;
  const discount = showCompare
    ? Math.round(((compareAt! - product.price) / compareAt!) * 100)
    : 0;
  const inStock = product.stock > 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      unit_price: Number(product.price),
      image_url: image,
      quantity: 1,
      organization_id: product.organization_id,
    });
    toast.success(`${product.name} added to cart`);
  };

  const onWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWished((w) => !w);
    toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <Link
      to={storeLink(`/product/${slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {image ? (
          <>
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
            />
            {hoverImage ? (
              <img
                src={hoverImage}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-all duration-700 group-hover:scale-100 group-hover:opacity-100"
              />
            ) : (
              <img
                src={image}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-3xl text-muted-foreground/40">
            {product.name[0]}
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.extras?.is_trending && (
            <span className="rounded-full bg-gradient-to-r from-primary to-primary-deep px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
              Trending
            </span>
          )}
          {product.extras?.is_featured && !product.extras?.is_trending && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal shadow-md">
              Featured
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-md">
              -{discount}% off
            </span>
          )}
        </div>

        {/* Wishlist top-right */}
        <button
          onClick={onWish}
          aria-label="Add to wishlist"
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-soft transition-all hover:scale-110",
            wished ? "text-primary" : "text-foreground hover:text-primary",
          )}
        >
          <Heart className={cn("h-4 w-4", wished && "fill-primary")} />
        </button>

        {/* Slide-up action bar */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={onAdd}
            disabled={!inStock}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-xs font-bold uppercase tracking-wider text-background shadow-lg transition-all hover:bg-primary disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {inStock ? "Quick Add" : "Sold out"}
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-foreground shadow-lg transition-colors hover:bg-muted"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="line-clamp-1 text-sm font-semibold tracking-tight">
          {product.name}
        </div>
        {product.extras?.short_description && (
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {product.extras.short_description}
          </div>
        )}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {currency(Number(product.price))}
          </span>
          {showCompare && (
            <span className="text-xs text-muted-foreground line-through">
              {currency(Number(compareAt))}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold text-primary">-{discount}%</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              inStock ? "bg-emerald-500" : "bg-destructive",
            )}
          />
          <span
            className={cn(
              "font-medium",
              inStock ? "text-emerald-600" : "text-destructive",
            )}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
