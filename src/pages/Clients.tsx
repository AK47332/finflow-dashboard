import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, Pencil, Trash2, Search, Mail, Phone, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { toast } from "sonner";
import { RecordViewDialog } from "@/components/common/RecordViewDialog";

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
};

export default function ClientsPage() {
  const { rows, loading, create, update, remove } = useOrgTable<Client>("clients", {
    column: "name",
    ascending: true,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [viewing, setViewing] = useState<Client | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.company]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setAddress("");
    setNotes("");
    setEditing(null);
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setName(c.name);
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setCompany(c.company ?? "");
    setAddress(c.address ?? "");
    setNotes(c.notes ?? "");
    setOpen(true);
  };

  // Open client from ?focus=<name> (e.g. clicked from Dashboard Top Clients)
  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus || loading || rows.length === 0) return;
    const match = rows.find(
      (r) => r.name.toLowerCase() === focus.toLowerCase(),
    );
    if (match) {
      openEdit(match);
    } else {
      setSearch(focus);
      toast.info(`No client named "${focus}" found. Add one?`);
    }
    // Clear the param so it doesn't re-trigger
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      };
      if (editing) await update(editing.id, payload);
      else await create(payload);
      toast.success(editing ? "Client updated" : "Client added");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
  };

  return (
    <CrudShell
      title="Clients"
      description="Your customer book."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No clients yet. Add your first one."
      onAdd={openAdd}
      addLabel="Add Client"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">With Email</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {rows.filter((r) => r.email).length}
            </p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">With Phone</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {rows.filter((r) => r.phone).length}
            </p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <div className="ft-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
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
              <TableHead className="text-foreground">Company</TableHead>
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Phone</TableHead>
              <TableHead className="ft-action-cell w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c, i) => (
              <TableRow key={c.id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.company ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {c.email ? (
                    <a className="inline-flex items-center gap-1 text-primary hover:underline" href={`mailto:${c.email}`}>
                      <Mail className="h-3 w-3" /> {c.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {c.phone ? (
                    <a className="inline-flex items-center gap-1 text-primary hover:underline" href={`tel:${c.phone}`}>
                      <Phone className="h-3 w-3" /> {c.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="ft-action-cell text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setViewing(c)} aria-label="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPendingDelete(c)}
                      aria-label="Delete"
                      className="text-expense hover:text-expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Name *</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cemail">Email</Label>
                <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cphone">Phone</Label>
                <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ccompany">Company</Label>
              <Input id="ccompany" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="caddress">Address</Label>
              <Textarea id="caddress" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnotes">Notes</Label>
              <Textarea id="cnotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add Client"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.name}"` : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await remove(pendingDelete.id);
                  toast.success("Client deleted");
                  setPendingDelete(null);
                } catch (e: any) {
                  toast.error(e.message ?? "Failed");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}