import { Link } from "react-router-dom";
import type { EcomCategory } from "@/lib/ecom";
import { cn } from "@/lib/utils";

type Props = {
  categories: EcomCategory[];
  activeSlug?: string | null;
};

export function CategoryPills({ categories, activeSlug }: Props) {
  if (categories.length === 0) return null;
  const items = [{ id: "all", name: "All", slug: "", image_url: null }, ...categories];
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max justify-center gap-5 py-4 md:gap-7">
        {items.map((c) => {
          const active = activeSlug === c.slug || (!activeSlug && c.slug === "");
          const href = c.slug ? `/shop?category=${c.slug}` : "/shop";
          return (
            <Link
              key={c.id}
              to={href}
              className="group flex min-w-[78px] flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-full border bg-muted shadow-soft transition-all duration-300 md:h-[88px] md:w-[88px]",
                  active
                    ? "ring-2 ring-offset-2 ring-gold border-transparent"
                    : "border-border/60 group-hover:shadow-lift",
                )}
                style={{ ['--tw-ring-offset-color' as any]: 'hsl(var(--background))' }}
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-gold/20 font-serif text-2xl font-bold text-primary">
                    {c.name[0]}
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-center text-[11px] font-semibold uppercase tracking-wider transition-colors md:text-xs",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
