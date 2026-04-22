import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, User, Menu, X, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AnnouncementBar } from "./AnnouncementBar";

type Props = {
  storeName: string;
  storeLogoUrl?: string | null;
  categories?: { name: string; slug: string }[];
};

export function StorefrontHeader({ storeName, storeLogoUrl, categories = [] }: Props) {
  const count = useCartStore((s) => s.count());
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
    }
  };

  // Split nav: half left, half right
  const leftLinks = categories.slice(0, 3);
  const rightLinks = categories.slice(3, 6);

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />
      <div
        className={cn(
          "border-b border-border/60 bg-background/85 backdrop-blur-md transition-all duration-300",
          scrolled ? "shadow-soft" : "",
        )}
      >
        <div
          className={cn(
            "container mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 transition-all md:grid-cols-3",
            scrolled ? "h-14" : "h-20",
          )}
        >
          {/* Mobile burger / desktop left nav */}
          <div className="flex items-center gap-6">
            <button
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <nav className="hidden items-center gap-6 md:flex">
              <Link to="/shop" className="text-[13px] font-semibold uppercase tracking-wider text-foreground/85 hover:text-primary">
                Shop
              </Link>
              {leftLinks.map((c) => (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="text-[13px] font-medium tracking-wide text-foreground/70 hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Centered logo */}
          <Link
            to="/"
            className="flex items-center justify-center font-serif-display tracking-tight"
          >
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt={storeName} className={cn("w-auto transition-all", scrolled ? "h-7" : "h-9")} />
            ) : (
              <span
                className={cn(
                  "font-bold text-foreground transition-all",
                  scrolled ? "text-xl" : "text-2xl md:text-3xl",
                )}
              >
                {storeName}
              </span>
            )}
          </Link>

          {/* Right: nav + icons */}
          <div className="flex items-center justify-end gap-1">
            <nav className="hidden items-center gap-6 pr-3 md:flex">
              {rightLinks.map((c) => (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="text-[13px] font-medium tracking-wide text-foreground/70 hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              to="/account?tab=wishlist"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
            <Link
              to={user ? "/account" : "/auth?customer=1"}
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        {/* Inline search drawer */}
        {searchOpen && (
          <div className="border-t border-border/60 bg-background">
            <form onSubmit={submit} className="container mx-auto flex items-center gap-2 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search lehenga, kurta, sherwani…"
                className="h-10 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </form>
          </div>
        )}

        {/* Mobile drawer */}
        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
              <Link to="/shop" className="rounded-lg px-2 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-muted" onClick={() => setOpen(false)}>
                Shop All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className="rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
