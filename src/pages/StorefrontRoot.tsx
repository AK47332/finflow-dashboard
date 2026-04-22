import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Link, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePublicStorefront } from "@/hooks/usePublicStorefront";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { StorefrontHome } from "./storefront/StorefrontHome";
import { StorefrontShop } from "./storefront/StorefrontShop";
import { StorefrontProduct } from "./storefront/StorefrontProduct";
import { StorefrontCart } from "./storefront/StorefrontCart";
import { StorefrontCheckout } from "./storefront/StorefrontCheckout";
import PortalPage from "./Portal";

/**
 * Public root resolver:
 * - If no primary org or mode = private → render the original Portal (existing behavior).
 * - If mode = ecommerce → render storefront with nested routes (/shop, /product/:slug, /cart, /checkout).
 * - If mode = landing → placeholder (built in next phase).
 */
export default function StorefrontRoot() {
  const { settings, loading } = usePublicStorefront();

  useEffect(() => {
    if (settings?.store_name) document.title = settings.store_name;
  }, [settings]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
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
  return (
    <StorefrontLayout
      orgId={orgId}
      storeName={storeName}
      storeLogoUrl={settings.store_logo_url}
      footerLogoUrl={settings.footer_logo_url}
    >
      <Routes>
        <Route index element={<StorefrontHome orgId={orgId} settings={settings} />} />
        <Route path="shop" element={<StorefrontShop orgId={orgId} />} />
        <Route path="product/:slug" element={<StorefrontProduct orgId={orgId} />} />
        <Route path="cart" element={<StorefrontCart />} />
        <Route path="checkout" element={<StorefrontCheckout orgId={orgId} />} />
        <Route path="*" element={<StorefrontHome orgId={orgId} settings={settings} />} />
      </Routes>
    </StorefrontLayout>
  );
}