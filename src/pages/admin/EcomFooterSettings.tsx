import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFooterSettings, DEFAULT_FOOTER } from "@/hooks/useFooterSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EcomFooterSettingsPage() {
  const { currentOrgId, role } = useOrg();
  const { user } = useAuth();
  const { settings, loading, reload } = useFooterSettings(currentOrgId);

  const [form, setForm] = useState(DEFAULT_FOOTER);
  const [badges, setBadges] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Footer Settings — Admin";
  }, []);

  useEffect(() => {
    setForm(settings);
    setBadges((settings.payment_badges ?? []).join(", "));
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
    return (
      <p className="text-sm text-muted-foreground">
        Only org owners and admins can edit footer settings.
      </p>
    );
  }

  const update = (k: keyof typeof DEFAULT_FOOTER, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    const payment_badges = badges
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await (supabase as any)
      .from("org_footer_settings")
      .upsert(
        {
          organization_id: currentOrgId,
          ...form,
          payment_badges,
          updated_by: user?.id,
        },
        { onConflict: "organization_id" },
      );
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Footer saved");
      void reload();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Footer Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the storefront footer: store description, contact info, social links and payment badges.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-semibold">Store description</h2>
        <div className="space-y-1.5">
          <Label>Short description</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A modern fashion house — curating timeless craft since 2018."
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-semibold">Contact</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Delhi · Mumbai · Online" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 90000 00000" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="hello@yourstore.com" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Contact button label</Label>
            <Input
              value={form.contact_button_label}
              onChange={(e) => update("contact_button_label", e.target.value)}
              placeholder="Contact us"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact button URL</Label>
            <Input
              value={form.contact_button_url}
              onChange={(e) => update("contact_button_url", e.target.value)}
              placeholder="mailto:hello@yourstore.com"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-semibold">Social links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Instagram URL</Label>
            <Input value={form.instagram_url} onChange={(e) => update("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Facebook URL</Label>
            <Input value={form.facebook_url} onChange={(e) => update("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>Twitter / X URL</Label>
            <Input value={form.twitter_url} onChange={(e) => update("twitter_url", e.target.value)} placeholder="https://x.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube URL</Label>
            <Input value={form.youtube_url} onChange={(e) => update("youtube_url", e.target.value)} placeholder="https://youtube.com/..." />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-semibold">Bottom strip</h2>
        <div className="space-y-1.5">
          <Label>Copyright text</Label>
          <Input
            value={form.copyright_text}
            onChange={(e) => update("copyright_text", e.target.value)}
            placeholder="© 2025 Your Store. All rights reserved."
          />
        </div>
        <div className="space-y-1.5">
          <Label>Payment badges (comma separated)</Label>
          <Input
            value={badges}
            onChange={(e) => setBadges(e.target.value)}
            placeholder="VISA, MC, AMEX, UPI, COD"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save footer"}
        </Button>
      </div>
    </div>
  );
}