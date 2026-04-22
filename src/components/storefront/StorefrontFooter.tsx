import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, CreditCard, Wallet, Truck } from "lucide-react";

export function StorefrontFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="text-base font-bold tracking-tight">{storeName}</div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Thoughtfully curated essentials for everyday living.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Social"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/shop" className="hover:text-primary">All products</Link></li>
            <li><Link to="/shop?featured=1" className="hover:text-primary">Featured</Link></li>
            <li><Link to="/shop?category=new-arrivals" className="hover:text-primary">New arrivals</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Help</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/account" className="hover:text-primary">My account</Link></li>
            <li><Link to="/account?tab=orders" className="hover:text-primary">Track orders</Link></li>
            <li><a href="#" className="hover:text-primary">Shipping & returns</a></li>
            <li><a href="#" className="hover:text-primary">Contact us</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">We accept</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { Icon: Wallet, label: "Cash" },
              { Icon: Truck, label: "COD" },
              { Icon: CreditCard, label: "Card" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-[11px] font-medium"
              >
                <Icon className="h-3.5 w-3.5 text-primary" /> {label}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Quality. Trust. Fast delivery.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
