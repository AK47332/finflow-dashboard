import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePublicStorefront } from "@/hooks/usePublicStorefront";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { StorefrontHome } from "./storefront/StorefrontHome";
import { StorefrontShop } from "./storefront/StorefrontShop";
import { StorefrontProduct } from "./storefront/StorefrontProduct";
import { StorefrontCart } from "./storefront/StorefrontCart";
import { StorefrontCheckout } from "./storefront/StorefrontCheckout";
import { StorefrontPage } from "./storefront/StorefrontPage";
import PortalPage from "./Portal";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import { StorefrontBasePathProvider } from "@/contexts/StorefrontBasePath";

// Reserved first-path segments that must NEVER be treated as a store slug.
// Keep in sync with the database trigger `check_org_slug_not_reserved`.
const RESERVED_PATHS = new Set([
  "auth", "onboarding", "dashboard", "income", "expense", "capital", "profit",
  "clients", "products", "pos", "services", "receivables", "payables", "notes",
  "reminders", "reports", "settings", "frontend-mood", "admin", "ecom", "account",
  "shop", "cart", "checkout", "product", "page",
]);

/**
 * Public root resolver:
 * - If no primary org or mode = private → render the original Portal (existing behavior).
 * - If mode = ecommerce → render storefront with nested routes (/shop, /product/:slug, /cart, /checkout).
 * - If mode = landing → placeholder (built in next phase).
 */
export default function StorefrontRoot() {
  const location = useLocation();
  const candidateSlug = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean)[0];
    if (!seg) return null;
    if (RESERVED_PATHS.has(seg.toLowerCase())) return null;
    // Sub-routes of a store: /<slug>, /<slug>/shop, /<slug>/cart, etc.
    if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/i.test(seg)) return null;
    return seg.toLowerCase();
  }, [location.pathname]);

  const { settings, loading, notFound } = usePublicStorefront(candidateSlug);
  const { loading: authLoading } = useAuth();
  const { isSuperAdmin, isOrgMember, loading: sessionLoading } = useSession();
  const isAdmin = isSuperAdmin || isOrgMember;

  useEffect(() => {
    if (settings?.store_name) document.title = settings.store_name;
  }, [settings]);

  if (loading || authLoading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // If the user typed /<something> that doesn't match a real store slug,
  // fall back to the primary storefront so they don't see a blank screen.
  if (candidateSlug && notFound) {
    return <Navigate to="/" replace />;
  }

  // If a logged-in admin or super admin lands on the storefront root,
  // send them to their own dashboard. Customers stay on the storefront.
  if (isAdmin && location.pathname === "/" && !candidateSlug) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only fall back to the original Portal when explicitly set to private.
  // If no settings exist at all, the hook synthesizes an ecommerce default,
  // so the public root domain shows the storefront by default.
  if (settings && settings.mode === "private") {
    return <PortalPage />;
  }
  if (!settings) {
    return <PortalPage />;
  }

  if (settings.mode === "landing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">{settings.store_name ?? "Welcome"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Landing Page mode is enabled. Landing page builder coming in the next phase.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Ecommerce mode
  const orgId = settings.organization_id;
  const storeName = settings.store_name ?? "Store";
  const basePath = candidateSlug ? `/${candidateSlug}` : "";
  return (
    <StorefrontBasePathProvider basePath={basePath}>
      <StorefrontLayout
        orgId={orgId}
        storeName={storeName}
        storeLogoUrl={settings.store_logo_url}
        footerLogoUrl={settings.footer_logo_url}
        themePrimaryColor={settings.theme_primary_color ?? null}
        themeAccentColor={settings.theme_accent_color ?? null}
      >
        <Routes>
          {candidateSlug ? (
            <Route path={`/${candidateSlug}`}>
              <Route index element={<StorefrontHome orgId={orgId} settings={settings} />} />
              <Route path="shop" element={<StorefrontShop orgId={orgId} />} />
              <Route path="product/:slug" element={<StorefrontProduct orgId={orgId} />} />
              <Route path="cart" element={<StorefrontCart />} />
              <Route path="checkout" element={<StorefrontCheckout orgId={orgId} />} />
              <Route path="page/:slug" element={<StorefrontPage orgId={orgId} />} />
              <Route path="*" element={<StorefrontHome orgId={orgId} settings={settings} />} />
            </Route>
          ) : (
            <>
              <Route index element={<StorefrontHome orgId={orgId} settings={settings} />} />
              <Route path="shop" element={<StorefrontShop orgId={orgId} />} />
              <Route path="product/:slug" element={<StorefrontProduct orgId={orgId} />} />
              <Route path="cart" element={<StorefrontCart />} />
              <Route path="checkout" element={<StorefrontCheckout orgId={orgId} />} />
              <Route path="page/:slug" element={<StorefrontPage orgId={orgId} />} />
              <Route path="*" element={<StorefrontHome orgId={orgId} settings={settings} />} />
            </>
          )}
        </Routes>
      </StorefrontLayout>
    </StorefrontBasePathProvider>
  );
}