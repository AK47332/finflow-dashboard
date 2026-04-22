

## Storefront polish + demo catalog seed

Goal: make the public storefront (home + product detail) feel like a real, modern shop — closer to the references you sent — and have it actually full of demo data right now so you can see it work.

### Part 1 — Seed demo categories, products, and a banner

I'll insert demo data into `Brown Fox` org (`is_primary` ecommerce — already configured):

**6 categories** (with Unsplash imagery):
- Women, Men, Shoes, Bags, Accessories, New Arrivals

**12 demo products** (published, with multi-image galleries, slugs, short + long descriptions, compare-at prices, and trending/featured flags). Examples:
- "Linen Summer Dress" — $59 (was $89), Women, Trending
- "Classic Denim Jacket" — $79, Men, Featured
- "Leather Crossbody Bag" — $129 (was $169), Bags, Trending+Featured
- "Minimal White Sneakers" — $99, Shoes, Featured
- "Oversized Hoodie" — $49, Men
- "Silk Scarf Set" — $35, Accessories
- …plus 6 more across categories

**1 hero banner** ("Spring Collection — up to 40% off")

All demo product images come from Unsplash CDN URLs (no upload needed). Inserted via the `insert tool` so we don't pollute migrations.

### Part 2 — Storefront Home redesign

A cleaner, more boutique-style layout:

```text
┌────────────────────────────────────────────┐
│  HERO  (full-bleed, large lifestyle image) │
│  left: tagline pill, big serif-feel title, │
│        subtitle, [Shop now] [Browse]       │
│  right: product image w/ floating price    │
│         card + "trending" sticker          │
├────────────────────────────────────────────┤
│  Marquee: free ship · 30-day returns ·     │
│  secure pay · 24/7 support                 │
├────────────────────────────────────────────┤
│  Shop by category (6 tiles, varied sizes,  │
│  bento-style grid on desktop)              │
├────────────────────────────────────────────┤
│  Trending now (4-up product grid)          │
├────────────────────────────────────────────┤
│  Promo split-banner (image left, copy +    │
│  CTA right, gradient overlay)              │
├────────────────────────────────────────────┤
│  New arrivals (horizontal scroll on mobile)│
├────────────────────────────────────────────┤
│  Featured products (4-up)                  │
├────────────────────────────────────────────┤
│  "Why shop with us" — 3 icon cards         │
├────────────────────────────────────────────┤
│  Newsletter strip (email input + Subscribe)│
└────────────────────────────────────────────┘
```

Visual upgrades:
- Larger, magazine-style hero with overlapping product card
- Bento-grid categories (1 large + 4 small + 1 wide) instead of equal squares
- New "New arrivals" section using the most recently created products, horizontal-scroll on mobile
- Refined `ProductCard`: cleaner badges, hover quick-view + add-to-cart bar that slides up from bottom (not just a small + button)
- Newsletter capture (UI only — submit shows a toast)

### Part 3 — Single Product page redesign

Match the second reference (rich, gallery-led layout):

```text
┌────────────────────────────────────────────┐
│ Breadcrumb                                 │
├──────────────────────┬─────────────────────┤
│  GALLERY             │  INFO               │
│  ┌──┐                │  Category tag       │
│  ┌──┐  Big main img  │  H1 product name    │
│  ┌──┐                │  ★★★★★ (24 reviews) │
│  ┌──┐                │  $price  $compare   │
│  thumbs (vertical)   │  "Save X%" pill     │
│                      │  Short desc         │
│                      │  ─── divider ───    │
│                      │  Size selector      │
│                      │  Color swatches     │
│                      │  Qty stepper        │
│                      │  [Add to cart] ♥ ⤴  │
│                      │  Stock status       │
│                      │  Trust strip (4 ic) │
├──────────────────────┴─────────────────────┤
│ Tabs: Description · Details · Shipping     │
├────────────────────────────────────────────┤
│ "You may also like" (4-up product grid)    │
└────────────────────────────────────────────┘
```

Upgrades:
- Vertical thumbnail strip on desktop (mobile keeps horizontal)
- Sticky "Add to cart" bar on mobile when scrolled
- Size + color selectors (UI-only for now — values pulled from `extras.tags` if present, else default S/M/L and 3 demo swatches; no schema change)
- Tabs section for Description / Details (SKU, stock, category) / Shipping & returns copy
- Reviews stub (★ rating shown, "24 reviews" — static for now; real reviews = future phase)
- Refined trust badges grid

### Part 4 — Header & footer micro-refinements

- Header: sticky shrink on scroll, announcement bar above ("Free shipping on orders over $50 — Shop now")
- Footer: payment-method icons row + social icons; copy stays editable from existing settings

### Technical details

- **No schema changes.** All new selectors (size/color), reviews count, and announcement bar are visual-only or read from existing fields.
- **Files I'll edit:**
  - `src/pages/storefront/StorefrontHome.tsx` — redesign sections
  - `src/pages/storefront/StorefrontProduct.tsx` — redesign layout, add tabs + size/color/qty
  - `src/components/storefront/ProductCard.tsx` — hover bar, refined badges
  - `src/components/storefront/StorefrontHeader.tsx` — announcement bar, scroll-shrink
  - `src/components/storefront/StorefrontFooter.tsx` — payment + social icons
- **Files I'll create:**
  - `src/components/storefront/AnnouncementBar.tsx`
  - `src/components/storefront/CategoryBento.tsx`
  - `src/components/storefront/NewsletterStrip.tsx`
  - `src/components/storefront/ProductTabs.tsx`
- **Demo data seed** via `insert tool` on `ecom_categories`, `products`, `ecom_product_extras`, `ecom_banners` for org `Brown Fox`. Uses Unsplash URLs (no upload). Data persists; you can edit/delete from admin Ecommerce Management anytime.

### Out of scope (next phase)

- Real product variants table (size/color affecting stock & price)
- Real reviews table
- Newsletter backend (just UI for now)
- Wishlist persistence

