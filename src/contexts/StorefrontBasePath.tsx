import { createContext, ReactNode, useContext } from "react";

/**
 * Holds the URL base path for the storefront currently being rendered.
 *
 * - "" when serving the primary store at the root (links go to /shop, /cart, ...).
 * - "/<slug>" when serving an admin's slug-prefixed store (links go to
 *   /<slug>/shop, /<slug>/cart, ...).
 *
 * Use `useStoreLink(path)` to build a link relative to the active store.
 */
const Ctx = createContext<string>("");

export function StorefrontBasePathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: ReactNode;
}) {
  return <Ctx.Provider value={basePath}>{children}</Ctx.Provider>;
}

export function useStorefrontBasePath() {
  return useContext(Ctx);
}

export function useStoreLink() {
  const base = useContext(Ctx);
  return (path: string) => {
    const cleaned = path.startsWith("/") ? path : `/${path}`;
    return base ? `${base}${cleaned}` : cleaned;
  };
}