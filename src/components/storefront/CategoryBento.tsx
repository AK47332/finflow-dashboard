import { Link } from "react-router-dom";
import type { EcomCategory } from "@/lib/ecom";
import { ArrowUpRight } from "lucide-react";

export function CategoryBento({ categories }: { categories: EcomCategory[] }) {
  if (categories.length === 0) return null;
  const c = categories.slice(0, 6);
  const layout = ["md:col-span-2 md:row-span-2", "", "", "", "", "md:col-span-2"];
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 md:auto-rows-[180px] md:grid-cols-4 md:gap-4">
      {c.map((cat, i) => (
        <Link
          key={cat.id}
          to={`/shop?category=${cat.slug}`}
          className={`group relative overflow-hidden rounded-2xl bg-muted/40 transition-all hover:shadow-lift ${layout[i] ?? ""}`}
        >
          {cat.image_url ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 md:p-5">
            <div>
              <div className="font-serif-display text-lg font-bold text-background md:text-xl">
                {cat.name}
              </div>
              {cat.description && (
                <div className="line-clamp-1 text-[11px] text-background/80">
                  {cat.description}
                </div>
              )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-charcoal opacity-0 transition-all group-hover:opacity-100">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
