import { Link } from "react-router-dom";
import { ShoppingBag, Eye } from "lucide-react";
import type { StorefrontProduct } from "@/lib/ecom";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const slug = product.extras?.slug ?? product.id;
  const image = product.extras?.image_urls?.[0] ?? null;
  const hoverImage = product.extras?.image_urls?.[1] ?? null;
  const compareAt = product.extras?.compare_at_price ?? null;
  const showCompare = compareAt && compareAt > product.price;
  const discount = showCompare
    ? Math.round(((compareAt! - product.price) / compareAt!) * 100)
    : 0;

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

  return (
    <Link
      to={`/product/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {image ? (
          <>
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
            />
            {hoverImage ? (
              <img
                src={hoverImage}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.extras?.is_trending && (
            <span className="rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
              Trending
            </span>
          )}
          {product.extras?.is_featured && !product.extras?.is_trending && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Featured
            </span>
          )}
        </div>
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{discount}%
          </span>
        )}

        {/* Slide-up action bar */}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-xs font-semibold text-background shadow-lg transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.stock > 0 ? "Add to cart" : "Sold out"}
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground shadow-lg transition-colors hover:bg-muted"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="line-clamp-1 text-sm font-semibold">{product.name}</div>
        {product.extras?.short_description && (
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {product.extras.short_description}
          </div>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            ${Number(product.price).toFixed(2)}
          </span>
          {showCompare && (
            <span className="text-xs text-muted-foreground line-through">
              ${Number(compareAt).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
