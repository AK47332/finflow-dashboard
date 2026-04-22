import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import type { EcomAnnouncement } from "@/lib/ecom";

export default function EcomAnnouncementsPage() {
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [items, setItems] = useState<EcomAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EcomAnnouncement> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_announcements")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order");
    setItems((data as EcomAnnouncement[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Announcements — Admin";
    void load();
  }, [currentOrgId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !currentOrgId || !user) return;
    const payload = {
      organization_id: currentOrgId,
      created_by: user.id,
      text: editing.text ?? "",
      icon: editing.icon ?? "✦",
      link_url: editing.link_url ?? null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      const { error } = await supabase.from("ecom_announcements").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ecom_announcements").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("ecom_announcements").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} items shown in the storefront top bar</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length, icon: "✦" })}>
              <Plus className="h-4 w-4" /> Add announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit announcement" : "New announcement"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Text *</Label>
                  <Input required value={editing.text ?? ""} onChange={(e) => setEditing({ ...editing, text: e.target.value })} placeholder="Free shipping above ₹999" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Icon / Symbol</Label>
                    <Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="✦" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Link URL (optional)</Label>
                    <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/shop" />
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
        <p className="py-12 text-center text-sm text-muted-foreground">No announcements yet. Add one to start the marquee.</p>
      ) : (
        <div className="grid gap-2">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
              <div className="text-lg text-gold">{a.icon || "✦"}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium">{a.text}</div>
                  {!a.is_active && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                </div>
                {a.link_url && <div className="truncate text-xs text-muted-foreground">→ {a.link_url}</div>}
              </div>
              <div className="text-xs text-muted-foreground">#{a.sort_order}</div>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
