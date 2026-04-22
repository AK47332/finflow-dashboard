import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useFrontendSettings } from "@/hooks/useFrontendSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe, ShoppingBag, FileText, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import type { FrontendMode } from "@/lib/ecom";
import { cn } from "@/lib/utils";

export default function FrontendMoodPage() {
  const { currentOrgId, currentOrg, role } = useOrg();
  const { user } = useAuth();
  const { settings, loading, reload } = useFrontendSettings(currentOrgId);
  const [mode, setMode] = useState<FrontendMode>("private");
  const [isPrimary, setIsPrimary] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeTagline, setStoreTagline] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroCtaLabel, setHeroCtaLabel] = useState("");
  const [heroCtaUrl, setHeroCtaUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Frontend Mood — Admin";
    if (settings) {
      setMode(settings.mode);
      setIsPrimary(settings.is_primary);
      setStoreName(settings.store_name ?? "");
      setStoreTagline(settings.store_tagline ?? "");
      setHeroTitle(settings.hero_title ?? "");
      setHeroSubtitle(settings.hero_subtitle ?? "");
      setHeroImage(settings.hero_image_url ?? "");
      setHeroCtaLabel(settings.hero_cta_label ?? "");
      setHeroCtaUrl(settings.hero_cta_url ?? "");
    }
  }, [settings]);

  const canEdit = role === "owner" || role === "admin";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!currentOrgId || !canEdit) {
    return <p className="text-sm text-muted-foreground">Only org owners and admins can change Frontend Mood.</p>;
  }

  const save = async () => {
    setBusy(true);
    // If marking primary, unset any other primary first
    if (isPrimary) {
      await supabase
        .from("org_frontend_settings")
        .update({ is_primary: false })
        .neq("organization_id", currentOrgId);
    }
    const { error } = await supabase
      .from("org_frontend_settings")
      .upsert(
        {
          organization_id: currentOrgId,
          mode,
          is_primary: isPrimary,
          store_name: storeName || currentOrg?.name || null,
          store_tagline: storeTagline || null,
          hero_title: heroTitle || null,
          hero_subtitle: heroSubtitle || null,
          hero_image_url: heroImage || null,
          hero_cta_label: heroCtaLabel || null,
          hero_cta_url: heroCtaUrl || null,
          updated_by: user?.id,
        },
        { onConflict: "organization_id" },
      );
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Frontend settings saved");
      void reload();
    }
  };

  const modes: { id: FrontendMode; title: string; desc: string; Icon: typeof Globe }[] = [
    { id: "private", title: "Private", desc: "Only logged-in admins access this app. No public storefront.", Icon: Lock },
    { id: "ecommerce", title: "Ecommerce", desc: "Public domain shows the storefront. Customers can sign up and shop.", Icon: ShoppingBag },
    { id: "landing", title: "Landing Page", desc: "Public domain shows a landing page (builder coming soon).", Icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frontend Mood</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what visitors see when they open your public domain.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-2xl border-2 bg-card p-4 text-left transition-all",
              mode === m.id ? "border-primary shadow-lift" : "border-border/60 hover:border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <m.Icon className="h-5 w-5 text-primary" />
              {mode === m.id && <Check className="h-4 w-4 text-primary" />}
            </div>
            <div className="mt-3 font-semibold">{m.title}</div>
            <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold">Primary public storefront</div>
            <p className="text-xs text-muted-foreground">
              When enabled, this organization serves the public root domain. Only one organization can be primary.
            </p>
          </div>
          <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
        </div>
      </section>

      {mode !== "private" && (
        <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-semibold">Store identity</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Store name</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder={currentOrg?.name ?? "My Store"} />
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="New collection" />
            </div>
          </div>

          {mode === "ecommerce" && (
            <>
              <div className="my-2 h-px bg-border" />
              <h2 className="font-semibold">Hero section</h2>
              <div className="space-y-1.5">
                <Label>Hero title</Label>
                <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Discover the season's best" />
              </div>
              <div className="space-y-1.5">
                <Label>Hero subtitle</Label>
                <Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Short copy under the headline" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Hero image URL</Label>
                  <Input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA label</Label>
                  <Input value={heroCtaLabel} onChange={(e) => setHeroCtaLabel(e.target.value)} placeholder="Shop now" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>CTA URL</Label>
                <Input value={heroCtaUrl} onChange={(e) => setHeroCtaUrl(e.target.value)} placeholder="/shop" />
              </div>
            </>
          )}
        </section>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save settings"}
        </Button>
      </div>
    </div>
  );
}