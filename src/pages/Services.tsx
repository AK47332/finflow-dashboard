import { useMemo, useState } from "react";
import { Briefcase, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { currency } from "@/lib/format";
import { toast } from "sonner";

export type Service = {
  id: string;
  name: string;
  price: number;
  unit: string | null;
  description: string | null;
};

export default function ServicesPage() {
  const { rows, loading, create, update, remove } = useOrgTable<Service>("services", {
    column: "name", ascending: true,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const reset = () => {
    setName(""); setPrice(""); setUnit(""); setDescription(""); setEditing(null);
  };
  const openAdd = () => { reset(); setOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s); setName(s.name); setPrice(s.price.toString());
    setUnit(s.unit ?? ""); setDescription(s.description ?? "");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    try {
      const payload = {
        name: name.trim(),
        price: parseFloat(price) || 0,
        unit: unit.trim() || null,
        description: description.trim() || null,
      };
      if (editing) await update(editing.id, payload);
      else await create(payload);
      toast.success(editing ? "Service updated" : "Service added");
      setOpen(false); reset();
    } catch (err: any) { toast.error(err.message ?? "Failed"); }
  };

  return (
    <CrudShell
      title="Services"
      description="Service offerings and pricing."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No services yet."
      onAdd={openAdd}
      addLabel="Add Service"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary"><Briefcase className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Services</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Average Price</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {rows.length ? currency(rows.reduce((s, r) => s + r.price, 0) / rows.length) : "—"}
            </p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <div className="ft-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search services…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        )
      }
    >
      <div className="ft-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary-soft/60 hover:bg-primary-soft/60">
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-right text-foreground">Price</TableHead>
              <TableHead className="text-foreground">Unit</TableHead>
              <TableHead className="text-foreground">Description</TableHead>
              <TableHead className="w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s, i) => (
              <TableRow key={s.id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                <TableCell className="text-right font-semibold">{currency(s.price)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.unit ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{s.description ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPendingDelete(s)} className="text-expense hover:text-expense"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sname">Name *</Label>
              <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Logo Design" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sprice">Price</Label>
                <Input id="sprice" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sunit">Unit</Label>
                <Input id="sunit" placeholder="per hour" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sdesc">Description</Label>
              <Textarea id="sdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add Service"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.name}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try { await remove(pendingDelete.id); toast.success("Service deleted"); setPendingDelete(null); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}