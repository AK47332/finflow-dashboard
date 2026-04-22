import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const SWATCHES: { name: string; hex: string }[] = [
  { name: "Crimson", hex: "#9b1f2e" },
  { name: "Maroon", hex: "#5b1a1a" },
  { name: "Coral", hex: "#E8593C" },
  { name: "Gold", hex: "#EF9F27" },
  { name: "Ivory", hex: "#F5EFE0" },
  { name: "Mint", hex: "#a7d3b8" },
  { name: "Royal Blue", hex: "#1d4a8a" },
  { name: "Forest", hex: "#1f3f30" },
  { name: "Charcoal", hex: "#1A1A1A" },
];

export function ColorFilter({ active }: { active?: string }) {
  const navigate = useNavigate();
  return (
    <section className="container mx-auto px-4 py-16 md:py-20">
      <div className="text-center">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Curated palette
        </div>
        <h2 className="heading-underline-center font-serif-display text-3xl font-bold md:text-4xl">
          Find by colour
        </h2>
      </div>
      <div className="mt-10 flex flex-wrap items-start justify-center gap-6 md:gap-8">
        {SWATCHES.map((s) => {
          const isActive = active?.toLowerCase() === s.name.toLowerCase();
          return (
            <button
              key={s.name}
              onClick={() => navigate(`/shop?q=${encodeURIComponent(s.name)}`)}
              className="group flex flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "block h-14 w-14 rounded-full border-2 shadow-soft transition-all duration-300 group-hover:scale-110 group-hover:shadow-lift md:h-16 md:w-16",
                  isActive
                    ? "ring-2 ring-offset-2 ring-foreground border-background"
                    : "border-background",
                )}
                style={{
                  backgroundColor: s.hex,
                  ['--tw-ring-offset-color' as any]: 'hsl(var(--background))',
                }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
