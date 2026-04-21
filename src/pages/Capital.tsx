import { useMemo, useState } from "react";
import { Wallet, Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type CapitalType = "contribution" | "withdrawal";

export type CapitalMovement = {
  id: string;
  type: CapitalType;
  amount: number;
  date: string;
  payment_method: string | null;
  description: string | null;
};

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Mobile Banking", "Card", "Other"];
const today = () => new Date().toISOString().slice(0, 10);

export default function CapitalPage() {
  const { rows, loading, create, update, remove } = useOrgTable<CapitalMovement>(
    "capital_movements",
    { column: "date", ascending: false },
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CapitalMovement | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CapitalMovement | null>(null);

  const [type, setType] = useState<CapitalType>("contribution");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [description, setDescription] = useState("");

  const totals = useMemo(() => {
    const contrib = rows.filter((r) => r.type === "contribution").reduce((s, r) => s + r.amount, 0);
    const withdr = rows.filter((r) => r.type === "withdrawal").reduce((s, r) => s + r.amount, 0);
    return { contrib, withdr, net: contrib - withdr };
  }, [rows]);

  const reset = () => {
    setType("contribution"); setAmount(""); setDate(today());
    setPaymentMethod("Bank Transfer"); setDescription(""); setEditing(null);
  };
  const openAdd = () => { reset(); setOpen(true); };
  const openEdit = (m: CapitalMovement) => {
    setEditing(m); setType(m.type); setAmount(m.amount.toString());
    setDate(m.date); setPaymentMethod(m.payment_method ?? "Bank Transfer");
    setDescription(m.description ?? ""); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    try {
      const payload = {
        type, amount: amt, date,
        payment_method: paymentMethod || null,
        description: description.trim() || null,
      };
      if (editing) await update(editing.id, payload);
      else await create(payload);
      toast.success(editing ? "Movement updated" : "Movement recorded");
      setOpen(false); reset();
    } catch (err: any) { toast.error(err.message ?? "Failed"); }
  };

  return (
    <CrudShell
      title="Capital"
      description="Owner contributions and withdrawals."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No capital movements yet."
      onAdd={openAdd}
      addLabel="Add Movement"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-income-soft text-income"><ArrowDownLeft className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Contributions</p>
                <p className="text-2xl font-bold text-foreground">{currency(totals.contrib)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-expense-soft text-expense"><ArrowUpRight className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Withdrawals</p>
                <p className="text-2xl font-bold text-foreground">{currency(totals.withdr)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary"><Wallet className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Net Capital</p>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? "text-income" : "text-expense"}`}>{currency(totals.net)}</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="ft-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary-soft/60 hover:bg-primary-soft/60">
              <TableHead className="text-foreground">Date</TableHead>
              <TableHead className="text-foreground">Type</TableHead>
              <TableHead className="text-foreground">Method</TableHead>
              <TableHead className="text-foreground">Description</TableHead>
              <TableHead className="text-right text-foreground">Amount</TableHead>
              <TableHead className="w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m, i) => (
              <TableRow key={m.id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{m.date}</TableCell>
                <TableCell>
                  {m.type === "contribution" ? (
                    <Badge className="bg-income-soft text-income hover:bg-income-soft">Contribution</Badge>
                  ) : (
                    <Badge className="bg-expense-soft text-expense hover:bg-expense-soft">Withdrawal</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.payment_method ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{m.description ?? "—"}</TableCell>
                <TableCell className={`text-right font-semibold ${m.type === "contribution" ? "text-income" : "text-expense"}`}>
                  {m.type === "contribution" ? "+" : "−"}{currency(m.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPendingDelete(m)} className="text-expense hover:text-expense"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Movement" : "Add Capital Movement"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Tabs value={type} onValueChange={(v) => setType(v as CapitalType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="contribution">Contribution</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kamt">Amount *</Label>
                <Input id="kamt" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kdate">Date *</Label>
                <Input id="kdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kdesc">Description</Label>
              <Textarea id="kdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Record Movement"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this movement?</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete ? `${pendingDelete.type} of ${currency(pendingDelete.amount)}` : ""}</AlertDialogDescription>
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