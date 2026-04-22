export type FrontendMode = "private" | "ecommerce" | "landing";

export type FrontendSettings = {
  organization_id: string;
  mode: FrontendMode;
  is_primary: boolean;
  store_name: string | null;
  store_tagline: string | null;
  store_logo_url: string | null;
  footer_logo_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_cta_label: string | null;
  hero_cta_url: string | null;
  theme_primary_color?: string | null;
  theme_accent_color?: string | null;
};

export type EcomCategory = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: string | null;
};

export type EcomProductExtra = {
  product_id: string;
  organization_id: string;
  ecom_category_id: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_trending: boolean;
  short_description: string | null;
  long_description: string | null;
  compare_at_price: number | null;
  image_urls: string[];
  tags: string[];
  slug: string;
};

export type StorefrontProduct = {
  id: string;
  organization_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  unit: string | null;
  description: string | null;
  extras: EcomProductExtra | null;
};

export type EcomBanner = {
  id: string;
  organization_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
};

export type CartItem = {
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  image_url: string | null;
  quantity: number;
  organization_id: string;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

export type EcomAnnouncement = {
  id: string;
  organization_id: string;
  text: string;
  icon: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type EcomInstagramPost = {
  id: string;
  organization_id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type EcomPage = {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  content: string;
  show_in_footer: boolean;
  sort_order: number;
  is_active: boolean;
};

export type EcomContactWidget = {
  organization_id: string;
  is_enabled: boolean;
  position: "bottom-right" | "bottom-left";
  greeting: string | null;
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  messenger_username: string | null;
  phone_number: string | null;
  email: string | null;
};