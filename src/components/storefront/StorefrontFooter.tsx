import { Link } from "react-router-dom";

export function StorefrontFooter({ storeName }: { storeName: string }) {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-base font-bold">{storeName}</div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Discover the latest products curated for you.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-primary">All products</Link></li>
            <li><Link to="/shop?featured=1" className="hover:text-primary">Featured</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Help</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/account" className="hover:text-primary">My account</Link></li>
            <li><Link to="/account?tab=orders" className="hover:text-primary">Track orders</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</div>
          <p className="mt-3 text-sm text-muted-foreground">Quality. Trust. Fast delivery.</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}