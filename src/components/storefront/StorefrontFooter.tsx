import { Link } from "react-router-dom";
import { useState } from "react";
import { Instagram, Facebook, Twitter, Youtube, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function StorefrontFooter({ storeName, orgId }: { storeName: string; orgId?: string | null }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter a valid email");
    if (!orgId) return toast.error("Storefront not ready");
    setBusy(true);
    const { error } = await supabase
      .from("ecom_newsletter_subscribers")
      .insert({ organization_id: orgId, email: email.trim().toLowerCase(), source: "footer" });
    setBusy(false);
    if (error && !error.message.includes("duplicate")) {
      return toast.error(error.message);
    }
    toast.success("Subscribed! Watch your inbox for festive drops.");
    setEmail("");
  };
  return (
    <footer className="mt-20 bg-charcoal text-background">
      {/* Newsletter */}
      <div className="border-b border-background/10">
        <div className="container mx-auto grid items-center gap-6 px-4 py-12 md:grid-cols-2 md:py-14">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Stay in the loop
            </div>
            <h3 className="mt-2 font-serif-display text-2xl font-bold leading-tight md:text-3xl">
              Get 10% off your first order
            </h3>
            <p className="mt-2 max-w-md text-sm text-background/70">
              New collections, festival edits & member-only deals — delivered weekly.
            </p>
          </div>
          <form onSubmit={onSubscribe} className="flex w-full gap-2 md:justify-end">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="h-12 max-w-sm border-background/20 bg-background/5 text-background placeholder:text-background/50 focus-visible:ring-gold"
            />
            <Button
              type="submit"
              size="lg"
              disabled={busy}
              className="h-12 bg-gold px-8 font-bold uppercase tracking-wider text-charcoal hover:bg-gold/90"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>

      {/* Columns */}
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="font-serif-display text-2xl font-bold tracking-tight">
            {storeName}
          </div>
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
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-gold">About</div>
          <ul className="mt-4 space-y-2.5 text-sm text-background/80">
            <li><a href="#" className="hover:text-gold">Our story</a></li>
            <li><a href="#" className="hover:text-gold">Sustainability</a></li>
            <li><a href="#" className="hover:text-gold">The artisans</a></li>
            <li><a href="#" className="hover:text-gold">Press</a></li>
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
            <li><a href="#" className="hover:text-gold">Shipping & returns</a></li>
            <li><a href="#" className="hover:text-gold">Size guide</a></li>
            <li><a href="#" className="hover:text-gold">Contact us</a></li>
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
