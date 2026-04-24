import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Crown } from "lucide-react";
import { useStoreLink } from "@/contexts/StorefrontBasePath";

export function PromoCards() {
  const storeLink = useStoreLink();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link
        to={`${storeLink("/shop")}?category=lehenga`}
        className="group relative overflow-hidden rounded-3xl bg-gradient-maroon p-7 text-background shadow-card transition-all hover:shadow-lift md:p-9"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/30 blur-3xl" />
        <Crown className="h-7 w-7 text-gold" />
        <h3 className="mt-4 font-serif-display text-2xl font-bold leading-tight md:text-3xl">
          Bridal Couture
        </h3>
        <p className="mt-2 max-w-xs text-sm text-background/80">
          Heirloom lehengas hand-crafted by master karigars. Made to order.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-charcoal transition-transform duration-300 group-hover:scale-105">
          Discover Bridal <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
      <Link
        to={`${storeLink("/shop")}?category=men`}
        className="group relative overflow-hidden rounded-3xl bg-gradient-forest p-7 text-background shadow-card transition-all hover:shadow-lift md:p-9"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/25 blur-3xl" />
        <Sparkles className="h-7 w-7 text-gold" />
        <h3 className="mt-4 font-serif-display text-2xl font-bold leading-tight md:text-3xl">
          Groom's Edit
        </h3>
        <p className="mt-2 max-w-xs text-sm text-background/80">
          Sherwanis, bandhgalas & kurtas — modern silhouettes, timeless craft.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-transform duration-300 group-hover:scale-105">
          Shop Men <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}
