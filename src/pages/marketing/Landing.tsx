import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingFeatures } from "@/components/marketing/LandingFeatures";
import { LandingShowcase } from "@/components/marketing/LandingShowcase";
import { LandingPricing } from "@/components/marketing/LandingPricing";
import { LandingFaq } from "@/components/marketing/LandingFaq";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export default function LandingPage() {
  const { user } = useAuth();

  // SEO: title, meta, canonical, JSON-LD
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "FinTrack Pro — Modern finance OS for growing teams";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const desc =
      "FinTrack Pro is the multi-workspace finance platform for income, expenses, receivables, payables, and reports — built for modern teams.";
    setMeta("description", desc);
    setMeta("og:title", "FinTrack Pro — Modern finance OS", "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "FinTrack Pro");
    setMeta("twitter:description", desc);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/";

    const ldId = "ld-software-app";
    let ld = document.getElementById(ldId) as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = ldId;
      document.head.appendChild(ld);
    }
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "FinTrack Pro",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: desc,
    });

    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="dark min-h-screen bg-[hsl(240_10%_4%)] text-[hsl(0_0%_98%)] antialiased">
      <div className="relative overflow-hidden">
        {/* ambient gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(262 83% 35% / 0.5) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(hsl(0_0%_100%/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%/0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />
        <LandingNav user={user} />
        <main>
          <LandingHero user={user} />
          <LandingShowcase />
          <LandingFeatures />
          <LandingPricing user={user} />
          <LandingFaq />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
