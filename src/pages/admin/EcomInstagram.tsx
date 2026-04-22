import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Instagram } from "lucide-react";
import { toast } from "sonner";
import type { EcomInstagramPost } from "@/lib/ecom";
import { ImageUploader } from "@/components/ui/ImageUploader";

export default function EcomInstagramPage() {
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [items, setItems] = useState<EcomInstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EcomInstagramPost> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_instagram_posts")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order");
    setItems((data as EcomInstagramPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Instagram — Admin";
    void load();
  }, [currentOrgId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !currentOrgId || !user) return;
    const payload = {
      organization_id: currentOrgId,
      created_by: user.id,
      image_url: editing.image_url ?? "",
      caption: editing.caption ?? null,
      link_url: editing.link_url ?? null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      const { error } = await supabase.from("ecom_instagram_posts").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ecom_instagram_posts").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("ecom_instagram_posts").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Instagram className="h-5 w-5 text-primary" /> Instagram Feed
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} tiles shown in the "Follow our story" section</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length })}>
              <Plus className="h-4 w-4" /> Add post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit Instagram post" : "New Instagram post"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-3">
                <ImageUploader
                  label="Image *"
                  value={editing.image_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  folder="instagram"
                />
                <div className="space-y-1.5">
                  <Label>Caption</Label>
                  <Input value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Link URL (optional)</Label>
                  <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://instagram.com/…" />
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
        <p className="py-12 text-center text-sm text-muted-foreground">No Instagram posts yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="relative aspect-square bg-muted">
                <img src={p.image_url} alt={p.caption ?? ""} className="h-full w-full object-cover" />
                {!p.is_active && <span className="absolute top-2 left-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] uppercase text-background">Hidden</span>}
              </div>
              <div className="flex items-center gap-1 p-2">
                <div className="flex-1 min-w-0">
                  {p.caption && <div className="truncate text-xs">{p.caption}</div>}
                  <div className="text-[10px] text-muted-foreground">#{p.sort_order}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
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
