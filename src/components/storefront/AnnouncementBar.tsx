const ITEMS = [
  "✦ 50% OFF on Festival Collection",
  "✦ Free Shipping above ₹999",
  "✦ New Arrivals Weekly",
  "✦ Easy 30-Day Returns",
  "✦ Made by Indian Artisans",
];

export function AnnouncementBar() {
  // Duplicate for seamless loop
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="bg-gradient-charcoal-gold text-background">
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-2.5 text-[11px] font-medium uppercase tracking-[0.18em]">
          {items.map((t, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-3">
              <span>{t}</span>
              <span className="text-gold">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
