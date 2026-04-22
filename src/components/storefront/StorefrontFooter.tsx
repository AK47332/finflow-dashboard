import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Youtube, Phone, Mail, MapPin } from "lucide-react";
import type { EcomPage } from "@/lib/ecom";

export function StorefrontFooter({
  storeName,
  footerLogoUrl,
  pages = [],
}: {
  storeName: string;
  orgId?: string | null;
  footerLogoUrl?: string | null;
  pages?: EcomPage[];
}) {
  return (
    <footer className="mt-20 bg-charcoal text-background">
      {/* Columns */}
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          {footerLogoUrl ? (
            <img src={footerLogoUrl} alt={storeName} className="h-12 w-auto object-contain" />
          ) : (
            <div className="font-serif-display text-2xl font-bold tracking-tight">
              {storeName}
            </div>
          )}
          <p className="mt-3 max-w-xs text-sm text-background/70">
            A modern South Asian fashion house — curating timeless craft and
            festive ready-to-wear since 2018.
          </p>
          <div className="mt-5 space-y-2 text-sm text-background/80">
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" /> Delhi · Mumbai · Online</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> +91 90000 00000</div>
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> hello@brownfox.couture</div>
          </div>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-background/20 text-background/80 transition-all hover:border-gold hover:bg-gold hover:text-charcoal"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Pages</div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/80">
            {pages.length === 0 && (
              <li className="text-background/50 text-xs italic">
                No pages yet
              </li>
            )}
            {pages.map((p) => (
              <li key={p.id}>
                <Link to={`/page/${p.slug}`} className="hover:text-gold">{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Shop</div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/80">
            <li><Link to="/shop" className="hover:text-gold">All products</Link></li>
            <li><Link to="/shop?category=lehenga" className="hover:text-gold">Lehenga</Link></li>
            <li><Link to="/shop?category=men" className="hover:text-gold">Men</Link></li>
            <li><Link to="/shop?category=bridal" className="hover:text-gold">Bridal</Link></li>
            <li><Link to="/shop?featured=1" className="hover:text-gold">Featured</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">Help</div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/80">
            <li><Link to="/account" className="hover:text-gold">My account</Link></li>
            <li><Link to="/account?tab=orders" className="hover:text-gold">Track orders</Link></li>
          </ul>
        </div>
      </div>

      {/* Payment + bottom strip */}
      <div className="border-t border-background/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-5 text-xs text-background/70 md:flex-row">
          <div>© {new Date().getFullYear()} {storeName}. Crafted with care in India.</div>
          <div className="flex flex-wrap items-center gap-2">
            {["VISA", "MC", "AMEX", "UPI", "PAYTM", "COD"].map((label) => (
              <span
                key={label}
                className="rounded-md border border-background/20 bg-background/5 px-2.5 py-1 text-[10px] font-bold tracking-wider text-background/85"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
