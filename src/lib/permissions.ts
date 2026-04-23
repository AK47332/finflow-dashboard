import type { OrgRole } from "@/contexts/OrgContext";

/**
 * Single source of truth for which paths each org role can see / access.
 *
 * - owner / admin: everything
 * - account_manager: everything EXCEPT /settings and ecommerce admin (/ecom/*, /frontend-mood)
 * - sales_manager: products / services / clients / pos / receivables / orders.
 *   NO profit, capital, settings, ecommerce settings.
 * - store_manager: ecommerce admin only.
 * - member: legacy, treated like account_manager for back-compat.
 */
export type RouteKey =
  | "/dashboard"
  | "/income"
  | "/expense"
  | "/capital"
  | "/profit"
  | "/clients"
  | "/products"
  | "/pos"
  | "/services"
  | "/receivables"
  | "/payables"
  | "/notes"
  | "/reminders"
  | "/reports"
  | "/settings"
  | "/frontend-mood"
  | "/ecom/orders"
  | "/ecom/categories"
  | "/ecom/banners"
  | "/ecom/announcements"
  | "/ecom/instagram"
  | "/ecom/customers"
  | "/ecom/pages"
  | "/ecom/contact-widget"
  | "/ecom/footer";

const ECOM_ADMIN: RouteKey[] = [
  "/frontend-mood",
  "/products",
  "/ecom/orders",
  "/ecom/categories",
  "/ecom/banners",
  "/ecom/announcements",
  "/ecom/instagram",
  "/ecom/customers",
  "/ecom/pages",
  "/ecom/contact-widget",
  "/ecom/footer",
];

const SALES_ALLOWED: RouteKey[] = [
  "/dashboard",
  "/income",
  "/expense",
  "/clients",
  "/products",
  "/pos",
  "/services",
  "/receivables",
  "/payables",
  "/notes",
  "/reminders",
  "/reports",
];

const STORE_ALLOWED: RouteKey[] = ["/dashboard", ...ECOM_ADMIN];

const ACCOUNT_DENY: RouteKey[] = ["/settings", ...ECOM_ADMIN];

export function canAccess(role: OrgRole | null, path: string): boolean {
  // No role yet → allow (auth is loading); the page itself will guard if needed.
  if (!role) return true;
  // Owner / admin: full access.
  if (role === "owner" || role === "admin") return true;

  // normalize path → first 2 segments (e.g. /ecom/orders, /settings)
  const norm = "/" + path.split("/").filter(Boolean).slice(0, 2).join("/");

  if (role === "sales_manager") {
    return SALES_ALLOWED.some((p) => norm === p || path.startsWith(p));
  }
  if (role === "store_manager") {
    return STORE_ALLOWED.some((p) => norm === p || path.startsWith(p));
  }
  if (role === "account_manager" || role === "member") {
    return !ACCOUNT_DENY.some((p) => norm === p || path.startsWith(p));
  }
  return false;
}

export function defaultLandingFor(role: OrgRole | null): string {
  if (role === "store_manager") return "/ecom/orders";
  return "/dashboard";
}

export const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  account_manager: "Account Manager",
  store_manager: "Store Manager",
  sales_manager: "Sales Manager",
  member: "Member",
};