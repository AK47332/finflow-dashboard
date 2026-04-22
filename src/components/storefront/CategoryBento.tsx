import { Link } from "react-router-dom";
import type { EcomCategory } from "@/lib/ecom";
import { ArrowUpRight } from "lucide-react";

export function CategoryBento({ categories }: { categories: EcomCategory[] }) {
  if (categories.length === 0) return null;
  // Bento layout: 1 large + small tiles
  const c = categories.slice(0, 6);
  const layout = [
    "md:col-span-2 md:row-span-2", // large
    "",
    "",
    "",
    "",
    "md:col-span-2", // wide
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 md:auto-rows-[170px] md:grid-cols-4">
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
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/15" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
            <div>
              <div className="text-base font-bold text-background md:text-lg">{cat.name}</div>
              {cat.description && (
                <div className="line-clamp-1 text-[11px] text-background/80">
                  {cat.description}
                </div>
              )}
            </div>
            <div className="rounded-full bg-background/95 p-2 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
