import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Phone, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CrudShell } from "@/components/crud/CrudShell";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { EcomContactWidget } from "@/lib/ecom";

const DEFAULTS = (orgId: string): EcomContactWidget => ({
  organization_id: orgId,
  is_enabled: true,
  position: "bottom-right",
  greeting: "Hi! How can we help you?",
  whatsapp_number: null,
  whatsapp_message: "Hello, I have a question about your products.",
  messenger_username: null,
  phone_number: null,
  email: null,
});

export default function EcomContactWidgetPage() {
  const { currentOrgId } = useOrg();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<EcomContactWidget | null>(null);

  useEffect(() => {
    if (!currentOrgId) return;
    setLoading(true);
    (supabase as any)
      .from("ecom_contact_widget")
      .select("*")
      .eq("organization_id", currentOrgId)
      .maybeSingle()
      .then(({ data }: any) => {
        setS((data as EcomContactWidget) ?? DEFAULTS(currentOrgId));
        setLoading(false);
      });
  }, [currentOrgId]);

  const update = <K extends keyof EcomContactWidget>(k: K, v: EcomContactWidget[K]) =>
    setS((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    if (!s || !currentOrgId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("ecom_contact_widget")
        .upsert({ ...s, organization_id: currentOrgId, updated_by: user?.id ?? null }, { onConflict: "organization_id" });
      if (error) throw error;
      toast.success("Contact widget saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !s) {
    return (
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
    );
  }

  return (
    <CrudShell
      title="Contact Widget"
      description="Floating chat button on the storefront — WhatsApp, Messenger, Phone, Email."
      loading={false}
      empty={false}
      emptyText=""
      onAdd={save}
      addLabel={saving ? "Saving…" : "Save settings"}
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="ft-card space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Display</h3>
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
            <div>
              <div className="text-sm font-medium">Show widget</div>
              <div className="text-xs text-muted-foreground">Toggle the floating contact button on the storefront.</div>
            </div>
            <Switch checked={s.is_enabled} onCheckedChange={(v) => update("is_enabled", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={s.position} onValueChange={(v: any) => update("position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom right</SelectItem>
                <SelectItem value="bottom-left">Bottom left</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Greeting</Label>
            <Input value={s.greeting ?? ""} onChange={(e) => update("greeting", e.target.value)} placeholder="Hi! How can we help you?" />
          </div>
        </div>

        <div className="ft-card space-y-4 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Channels</h3>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp number</Label>
            <Input value={s.whatsapp_number ?? ""} onChange={(e) => update("whatsapp_number", e.target.value)} placeholder="+8801XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp prefilled message</Label>
            <Textarea rows={2} value={s.whatsapp_message ?? ""} onChange={(e) => update("whatsapp_message", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-blue-600" /> Messenger username</Label>
            <Input value={s.messenger_username ?? ""} onChange={(e) => update("messenger_username", e.target.value)} placeholder="yourpage (without m.me/)" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> Phone</Label>
            <Input value={s.phone_number ?? ""} onChange={(e) => update("phone_number", e.target.value)} placeholder="+8801XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-amber-600" /> Email</Label>
            <Input type="email" value={s.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="hello@store.com" />
          </div>

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save settings
          </Button>
        </div>
      </div>
    </CrudShell>
  );
}