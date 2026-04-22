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
import { Plus, Pencil, Trash2, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { slugify, type EcomCategory } from "@/lib/ecom";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EcomCategoriesPage() {
  const { currentOrgId } = useOrg();
  const { user } = useAuth();
  const [items, setItems] = useState<EcomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EcomCategory> | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_categories")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order");
    setItems((data as EcomCategory[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Categories — Admin";
    void load();
  }, [currentOrgId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !currentOrgId || !user) return;
    // Prevent assigning a category as its own parent (or to one of its descendants)
    if (editing.id && editing.parent_id) {
      const isDescendant = (parentId: string): boolean => {
        if (parentId === editing.id) return true;
        const p = items.find((x) => x.id === parentId);
        return p?.parent_id ? isDescendant(p.parent_id) : false;
      };
      if (isDescendant(editing.parent_id)) {
        return toast.error("A category can't be its own parent or a child of itself.");
      }
    }
    const payload = {
      organization_id: currentOrgId,
      created_by: user.id,
      name: editing.name ?? "",
      slug: editing.slug || slugify(editing.name ?? ""),
      description: editing.description ?? null,
      image_url: editing.image_url ?? null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
      parent_id: editing.parent_id ?? null,
    };
    if (editing.id) {
      const { error } = await supabase.from("ecom_categories").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ecom_categories").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false);
    setEditing(null);
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("ecom_categories").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ is_active: true, sort_order: items.length })}>
              <Plus className="h-4 w-4" /> Add category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle>
            </DialogHeader>
            {editing && (
              <form onSubmit={save} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    required
                    value={editing.name ?? ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                </div>
                <ImageUploader
                  label="Image"
                  value={editing.image_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_url: url })}
                  folder="categories"
                />
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
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
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            items.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {c.image_url ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-semibold">{c.name}</div>
                    {!c.is_active && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase">Hidden</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">/{c.slug}</div>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}