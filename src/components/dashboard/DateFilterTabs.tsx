import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = ["Today", "This Week", "This Month", "This Year", "Custom"];

export function DateFilterTabs({ defaultValue = "This Month" }: { defaultValue?: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <div className="inline-flex rounded-2xl border border-border/60 bg-card p-1 shadow-soft">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setActive(t)}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-smooth sm:text-sm",
            active === t
              ? "bg-gradient-primary text-primary-foreground shadow-primary-glow"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}