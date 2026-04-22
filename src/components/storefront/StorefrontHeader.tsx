import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
      <AnnouncementBar />
      <div
        className={cn(
          "border-b border-border/60 transition-all",
          scrolled ? "shadow-sm" : "",
        )}
      >
        <div
          className={cn(
            "container mx-auto flex items-center gap-4 px-4 transition-all",
            scrolled ? "h-14" : "h-16",
          )}
        >
          <button
            className="md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt={storeName} className="h-7 w-auto" />
            ) : (
              <span
                className={cn(
                  "bg-gradient-primary bg-clip-text text-transparent transition-all",
                  scrolled ? "text-base" : "text-lg",
                )}
              >
                {storeName}
              </span>
            )}
          </Link>

          <nav className="hidden flex-1 items-center gap-6 md:flex">
            <Link to="/shop" className="text-sm font-medium text-foreground/80 hover:text-primary">
              Shop
            </Link>
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                to={`/shop?category=${c.slug}`}
                className="text-sm font-medium text-foreground/70 hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <form onSubmit={submit} className="hidden flex-1 max-w-sm md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products"
                className="h-9 pl-9"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/cart" aria-label="Cart">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
              <Link to={user ? "/account" : "/auth?customer=1"} aria-label="Account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-background md:hidden">
            <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
              <Link to="/shop" className="rounded-lg px-2 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                Shop
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
              <form onSubmit={submit} className="pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products"
                    className={cn("pl-9")}
                  />
                </div>
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
