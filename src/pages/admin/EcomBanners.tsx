import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EcomBanner } from "@/lib/ecom";
import { ImageUploader } from "@/components/ui/ImageUploader";

export default function EcomBannersPage() {
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [items, setItems] = useState<EcomBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EcomBanner> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_banners")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order");
    setItems((data as EcomBanner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Banners — Admin";
    void load();
  }, [currentOrgId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !currentOrgId || !user) return;
    const payload = {
      organization_id: currentOrgId,
      created_by: user.id,
      title: editing.title ?? "",
      subtitle: editing.subtitle ?? null,
      image_url: editing.image_url ?? null,
      cta_label: editing.cta_label ?? null,
      cta_url: editing.cta_url ?? null,
      position: editing.position ?? "hero",
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      const { error } = await supabase.from("ecom_banners").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ecom_banners").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("ecom_banners").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} banners</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length, position: "hero" })}>
              <Plus className="h-4 w-4" /> Add banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit banner" : "New banner"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Subtitle</Label>
                  <Textarea value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
                </div>
                <ImageUploader
                  label="Image"
                  value={editing.image_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  folder="banners"
                  previewClassName="h-40"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>CTA label</Label>
                    <Input value={editing.cta_label ?? ""} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA URL</Label>
                    <Input value={editing.cta_url ?? ""} onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Sort order</Label>
                    <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 px-3">
                    <Label>Active</Label>
                    <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No banners yet.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((b) => (
            <div key={b.id} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-3">
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                {b.image_url ? <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-semibold">{b.title}</div>
                  {!b.is_active && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                </div>
                {b.subtitle && <div className="line-clamp-1 text-xs text-muted-foreground">{b.subtitle}</div>}
                {b.cta_label && <div className="mt-1 text-xs text-muted-foreground">CTA: {b.cta_label} → {b.cta_url}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(b); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}