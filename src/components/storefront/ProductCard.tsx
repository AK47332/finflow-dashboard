import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { StorefrontProduct } from "@/lib/ecom";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const slug = product.extras?.slug ?? product.id;
  const image = product.extras?.image_urls?.[0] ?? null;
  const compareAt = product.extras?.compare_at_price ?? null;
  const showCompare = compareAt && compareAt > product.price;
  const discount = showCompare
    ? Math.round(((compareAt! - product.price) / compareAt!) * 100)
    : 0;

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {product.extras?.is_trending && (
          <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            Trending
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{discount}%
          </span>
        )}
        <button
          onClick={onAdd}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          aria-label="Add to cart"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="line-clamp-1 text-sm font-semibold">{product.name}</div>
        {product.extras?.short_description && (
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {product.extras.short_description}
          </div>
        )}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">
            ${Number(product.price).toFixed(2)}
          </span>
          {showCompare && (
            <span className="text-xs text-muted-foreground line-through">
              ${Number(compareAt).toFixed(2)}
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] font-medium text-emerald-600">
          {product.stock > 0 ? "In stock" : "Out of stock"}
        </div>
      </div>
    </Link>
  );
}