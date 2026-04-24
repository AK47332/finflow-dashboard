import { useStoreLink } from "@/contexts/StorefrontBasePath";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";
import { currency } from "@/lib/format";

export function StorefrontCart() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse products and add your favorites.</p>
        <Button asChild className="mt-6">
          <Link to={storeLink("/shop")}>Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.product_id}
              className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-3"
            >
              <div className="h-20 w-20 overflow-hidden rounded-xl bg-muted">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="line-clamp-1 font-semibold">{it.name}</div>
                {it.sku && <div className="text-xs text-muted-foreground">SKU: {it.sku}</div>}
                <div className="mt-1 text-sm font-bold text-primary">
                  {currency(it.unit_price)}
                </div>
              </div>
              <div className="flex items-center rounded-lg border border-border/60">
                <button onClick={() => updateQty(it.product_id, it.quantity - 1)} className="px-2 py-1.5 hover:bg-muted">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                <button onClick={() => updateQty(it.product_id, it.quantity + 1)} className="px-2 py-1.5 hover:bg-muted">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="w-20 text-right text-sm font-bold">
                {currency(it.unit_price * it.quantity)}
              </div>
              <button
                onClick={() => removeItem(it.product_id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-base font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{currency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-xs">Calculated at checkout</span>
            </div>
            <div className="my-3 h-px bg-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{currency(subtotal)}</span>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate("/checkout")}>
            Checkout <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to={storeLink("/shop")}>Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}