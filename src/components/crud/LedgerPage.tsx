import { useMemo, useState } from "react";
import { Pencil, Trash2, Search, ArrowDownLeft, ArrowUpRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { currency } from "@/lib/format";
import { toast } from "sonner";
import { FileAttachment, AttachmentValue } from "@/components/ui/FileAttachment";
import { Paperclip } from "lucide-react";
import { RecordViewDialog } from "@/components/common/RecordViewDialog";

export type LedgerStatus = "pending" | "partial" | "paid" | "overdue";

export type LedgerEntry = {
  id: string;
  title: string | null;
  party_name: string; // client_name | vendor_name (mapped by parent)
  client_id?: string | null;
  description: string | null;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  status: LedgerStatus;
  document_url: string | null;
  document_path: string | null;
  document_name: string | null;
  document_type: string | null;
};

const STATUSES: LedgerStatus[] = ["pending", "partial", "paid", "overdue"];
const STATUS_STYLES: Record<LedgerStatus, string> = {
  pending: "bg-muted text-foreground hover:bg-muted",
  partial: "bg-profit-soft text-profit hover:bg-profit-soft",
  paid: "bg-income-soft text-income hover:bg-income-soft",
  overdue: "bg-expense-soft text-expense hover:bg-expense-soft",
};

type Props = {
  variant: "receivable" | "payable";
};

export function LedgerPage({ variant }: Props) {
  const isReceivable = variant === "receivable";
  const table = (isReceivable ? "receivables" : "payables") as "receivables" | "payables";
  const partyField = isReceivable ? "client_name" : "vendor_name";
  const partyLabel = isReceivable ? "Client" : "Vendor";

  const { rows: rawRows, loading, create, update, remove } = useOrgTable<any>(table, {
    column: "due_date", ascending: true,
  });

  // For receivables: pull clients for the picker.
  const { rows: clients } = useOrgTable<{ id: string; name: string }>("clients", {
    column: "name",
    ascending: true,
  });

  const rows: LedgerEntry[] = useMemo(
    () => rawRows.map((r) => ({
      id: r.id,
      title: r.title ?? null,
      party_name: r[partyField] ?? "",
      client_id: r.client_id ?? null,
      description: r.description,
      amount: Number(r.amount),
      amount_paid: Number(r.amount_paid),
      due_date: r.due_date,
      status: r.status,
      document_url: r.document_url ?? null,
      document_path: r.document_path ?? null,
      document_name: r.document_name ?? null,
      document_type: r.document_type ?? null,
    })),
    [rawRows, partyField],
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LedgerEntry | null>(null);

  const [partyName, setPartyName] = useState("");
  const [clientPick, setClientPick] = useState<string>("__custom__");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<LedgerStatus>("pending");
  const [attachment, setAttachment] = useState<AttachmentValue>({
    url: null, path: null, name: null, type: null,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.party_name, r.description].filter(Boolean).some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const paid = rows.reduce((s, r) => s + r.amount_paid, 0);
    const open = total - paid;
    return { total, paid, open };
  }, [rows]);

  const reset = () => {
    setPartyName(""); setClientPick("__custom__"); setTitle("");
    setDescription(""); setAmount(""); setAmountPaid("");
    setDueDate(""); setStatus("pending"); setEditing(null);
    setAttachment({ url: null, path: null, name: null, type: null });
  };
  const openAdd = () => { reset(); setOpen(true); };
  const openEdit = (r: LedgerEntry) => {
    setEditing(r);
    setPartyName(r.party_name);
    setClientPick(r.client_id ?? "__custom__");
    setTitle(r.title ?? "");
    setDescription(r.description ?? "");
    setAmount(r.amount.toString()); setAmountPaid(r.amount_paid.toString());
    setDueDate(r.due_date ?? ""); setStatus(r.status);
    setAttachment({
      url: r.document_url, path: r.document_path,
      name: r.document_name, type: r.document_type,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!description.trim()) return toast.error("Description is required");
    if (!partyName.trim()) return toast.error(`${partyLabel} name is required`);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    const paid = parseFloat(amountPaid) || 0;
    if (paid > amt) return toast.error("Amount paid cannot exceed total amount");

    // auto-derive status if not manually overdue
    let computedStatus = status;
    if (status !== "overdue") {
      if (paid >= amt) computedStatus = "paid";
      else if (paid > 0) computedStatus = "partial";
      else computedStatus = "pending";
    }

    try {
      const payload: Record<string, any> = {
        [partyField]: partyName.trim(),
        title: title.trim(),
        description: description.trim() || null,
        amount: amt,
        amount_paid: paid,
        due_date: dueDate || null,
        status: computedStatus,
        document_url: attachment.url,
        document_path: attachment.path,
        document_name: attachment.name,
        document_type: attachment.type,
      };
      if (isReceivable) {
        payload.client_id =
          clientPick && clientPick !== "__custom__" ? clientPick : null;
      }
      if (editing) await update(editing.id, payload);
      else await create(payload);
      toast.success(editing ? "Entry updated" : "Entry added");
      setOpen(false); reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  return (
    <CrudShell
      title={isReceivable ? "Receivables" : "Payables"}
      description={isReceivable ? "Money owed to you." : "Money you owe."}
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText={isReceivable ? "No receivables yet." : "No payables yet."}
      onAdd={openAdd}
      addLabel={isReceivable ? "Add Receivable" : "Add Payable"}
      addClassName={isReceivable
        ? "bg-gradient-income text-income-foreground hover:opacity-90"
        : "bg-gradient-expense text-expense-foreground hover:opacity-90"}
      stats={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className={`ft-stat-icon ${isReceivable ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
                {isReceivable ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total {isReceivable ? "Receivable" : "Payable"}</p>
                <p className="text-2xl font-bold text-foreground">{currency(totals.total)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Paid</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{currency(totals.paid)}</p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <p className={`mt-1 text-2xl font-bold ${isReceivable ? "text-income" : "text-expense"}`}>{currency(totals.open)}</p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <div className="ft-card flex flex-wrap items-center gap-2 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${partyLabel.toLowerCase()} or note…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    >
      <div className="ft-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className={isReceivable ? "bg-income-soft/60 hover:bg-income-soft/60" : "bg-expense-soft/60 hover:bg-expense-soft/60"}>
              <TableHead className="text-foreground">{partyLabel}</TableHead>
              <TableHead className="text-foreground">Title / Description</TableHead>
              <TableHead className="text-foreground">Due</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-right text-foreground">Amount</TableHead>
              <TableHead className="text-right text-foreground">Paid</TableHead>
              <TableHead className="text-right text-foreground">Outstanding</TableHead>
              <TableHead className="ft-action-cell w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={r.id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                <TableCell className="font-medium text-foreground">{r.party_name}</TableCell>
                <TableCell className="max-w-xs text-sm">
                  {r.title && <div className="truncate font-medium text-foreground">{r.title}</div>}
                  {r.description && (
                    <div className="truncate text-muted-foreground">{r.description}</div>
                  )}
                  {r.document_url && (
                    <a
                      href={r.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      {r.document_name ?? "Attachment"}
                    </a>
                  )}
                  {!r.title && !r.description && !r.document_url && "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.due_date ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={`${STATUS_STYLES[r.status]} capitalize`}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{currency(r.amount)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{currency(r.amount_paid)}</TableCell>
                <TableCell className={`text-right font-semibold ${isReceivable ? "text-income" : "text-expense"}`}>
                  {currency(r.amount - r.amount_paid)}
                </TableCell>
                <TableCell className="ft-action-cell text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPendingDelete(r)} className="text-expense hover:text-expense"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? `Edit ${isReceivable ? "Receivable" : "Payable"}` : `Add ${isReceivable ? "Receivable" : "Payable"}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ltitle">Title *</Label>
              <Input
                id="ltitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isReceivable ? "Invoice INV-1024" : "Vendor bill #842"}
              />
            </div>

            {isReceivable ? (
              <div className="space-y-1.5">
                <Label>{partyLabel} *</Label>
                <Select
                  value={clientPick}
                  onValueChange={(v) => {
                    setClientPick(v);
                    if (v !== "__custom__") {
                      const c = clients.find((cc) => cc.id === v);
                      if (c) setPartyName(c.name);
                    } else {
                      setPartyName("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a client or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__custom__">+ Custom name</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientPick === "__custom__" && (
                  <Input
                    className="mt-2"
                    placeholder="Custom client name"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="lname">{partyLabel} name *</Label>
                <Input
                  id="lname"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="ACME Supplies"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ldesc">Description *</Label>
              <Textarea
                id="ldesc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this for?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lamt">Amount *</Label>
                <Input id="lamt" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lpaid">Amount Paid</Label>
                <Input id="lpaid" type="number" step="0.01" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ldue">Due Date</Label>
                <Input id="ldue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as LedgerStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-set from amounts unless Overdue.</p>
              </div>
            </div>
            <FileAttachment value={attachment} onChange={setAttachment} />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete ? `${pendingDelete.party_name} — ${currency(pendingDelete.amount)}` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try { await remove(pendingDelete.id); toast.success("Deleted"); setPendingDelete(null); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}