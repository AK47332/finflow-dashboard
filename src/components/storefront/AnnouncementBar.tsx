import { Truck } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background">
      <div className="container mx-auto flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-medium tracking-wide">
        <Truck className="h-3 w-3" />
        <span>Free shipping on orders over $50 — limited time</span>
      </div>
    </div>
  );
}
