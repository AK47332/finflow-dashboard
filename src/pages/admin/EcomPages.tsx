import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CrudShell } from "@/components/crud/CrudShell";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { slugify, type EcomPage } from "@/lib/ecom";

export default function EcomPagesPage() {
  const { currentOrgId } = useOrg();
  const [rows, setRows] = useState<EcomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EcomPage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EcomPage | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [showInFooter, setShowInFooter] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("ecom_pages")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("sort_order", { ascending: true });
    setRows((data as EcomPage[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [currentOrgId]);

  const reset = () => {
    setTitle(""); setSlug(""); setContent(""); setShowInFooter(true);
    setIsActive(true); setSortOrder("0"); setEditing(null);
  };

  const openAdd = () => { reset(); setOpen(true); };
  const openEdit = (p: EcomPage) => {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content ?? "");
    setShowInFooter(p.show_in_footer);
    setIsActive(p.is_active);
    setSortOrder(String(p.sort_order ?? 0));
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrgId) return toast.error("No organization selected");
    if (!title.trim()) return toast.error("Title required");
    const finalSlug = (slug.trim() || slugify(title)).toLowerCase();
    const payload = {
      organization_id: currentOrgId,
      title: title.trim(),
      slug: finalSlug,
      content,
      show_in_footer: showInFooter,
      is_active: isActive,
      sort_order: parseInt(sortOrder, 10) || 0,
    };
    try {
      if (editing) {
        const { error } = await (supabase as any)
          .from("ecom_pages")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Page updated");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Not signed in");
        const { error } = await (supabase as any)
          .from("ecom_pages")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Page created");
      }
      setOpen(false);
      reset();
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  const toggleActive = async (p: EcomPage) => {
    const { error } = await (supabase as any)
      .from("ecom_pages")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, is_active: !p.is_active } : r)));
  };

  return (
    <CrudShell
      title="Storefront Pages"
      description="Create CMS pages like About, Contact, Shipping & Returns. Footer links update automatically."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No pages yet. Create your first one."
      onAdd={openAdd}
      addLabel="New Page"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
    >
      <div className="grid gap-3">
        {rows.map((p) => (
          <div key={p.id} className="ft-card flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary"><FileText className="h-4 w-4" /></div>
              <div>
                <div className="font-semibold text-foreground">{p.title}</div>
                <div className="text-xs text-muted-foreground">/page/{p.slug} · {p.show_in_footer ? "In footer" : "Hidden from footer"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                <span className="text-muted-foreground">{p.is_active ? "Active" : "Inactive"}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-expense" onClick={() => setPendingDelete(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit page" : "New page"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ptitle">Title *</Label>
                <Input id="ptitle" value={title} onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pslug">Slug</Label>
                <Input id="pslug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcontent">Content (HTML or plain text)</Label>
              <Textarea id="pcontent" rows={10} value={content} onChange={(e) => setContent(e.target.value)} placeholder="<p>About us…</p>" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="psort">Sort order</Label>
                <Input id="psort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm pt-6">
                <Switch checked={showInFooter} onCheckedChange={setShowInFooter} /> Show in footer
              </label>
              <label className="flex items-center gap-2 text-sm pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} /> Active
              </label>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save" : <><Plus className="mr-1 h-4 w-4" /> Create</>}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                const { error } = await (supabase as any).from("ecom_pages").delete().eq("id", pendingDelete.id);
                if (error) { toast.error(error.message); return; }
                toast.success("Page deleted");
                setPendingDelete(null);
                await load();
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}