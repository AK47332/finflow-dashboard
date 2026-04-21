import { useEffect, useMemo, useState } from "react";
import { TrendingDown, Plus, Search, Download, FileText, Pencil, Trash2, ArrowUpDown, Paperclip, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";
import { EXPENSE_CATEGORIES, useExpenseStore, type Expense } from "@/store/expenseStore";
import { ExpenseFormDialog } from "@/components/expense/ExpenseFormDialog";
import { exportExpensesCSV, exportExpensesPDF } from "@/lib/export";
import { deleteExpenseAttachment } from "@/lib/storage";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

type RangeKey = "Today" | "This Week" | "This Month" | "This Year" | "All";
const RANGE_TABS: RangeKey[] = ["Today", "This Week", "This Month", "This Year", "All"];

function inRange(dateISO: string, range: RangeKey) {
  if (range === "All") return true;
  const d = new Date(dateISO);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "Today") return d >= startOfToday;
  if (range === "This Week") {
    const day = startOfToday.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(startOfToday);
    monday.setDate(startOfToday.getDate() - diff);
    return d >= monday;
  }
  if (range === "This Month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (range === "This Year") return d.getFullYear() === now.getFullYear();
  return true;
}

export default function ExpensePage() {
  const { expenses, add, update, remove, fetch, loadedOrgId } = useExpenseStore();
  const { user } = useAuth();
  const { currentOrgId } = useOrg();

  useEffect(() => {
    if (currentOrgId && currentOrgId !== loadedOrgId) {
      void fetch(currentOrgId).catch((e) => toast.error(e.message ?? "Failed to load expenses"));
    }
  }, [currentOrgId, loadedOrgId, fetch]);

  const [range, setRange] = useState<RangeKey>("All");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortDesc, setSortDesc] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((i) => inRange(i.date, range))
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) =>
        q
          ? [i.title, i.vendor, i.category, i.paymentMethod]
              .filter(Boolean)
              .some((v) => v!.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) =>
        sortDesc ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
      );
  }, [expenses, range, category, search, sortDesc]);

  const total = filtered.reduce((s, i) => s + i.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (i: Expense) => {
    setEditing(i);
    setDialogOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Expense</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep an eye on your outgoings.</p>
        </div>
        <Button onClick={openAdd} className="bg-gradient-expense text-expense-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="ft-card p-5">
          <div className="flex items-center gap-3">
            <div className="ft-stat-icon bg-expense-soft text-expense">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Expense</p>
              <p className="text-2xl font-bold text-foreground">{currency(total)}</p>
            </div>
          </div>
        </div>
        <div className="ft-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Entries</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="ft-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Average</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {filtered.length ? currency(total / filtered.length) : "—"}
          </p>
        </div>
      </div>

      <div className="ft-card flex flex-col gap-3 p-4">
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-muted/50 p-1">
          {RANGE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-smooth sm:text-sm",
                range === t
                  ? "bg-gradient-expense text-expense-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, vendor, method…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => exportExpensesCSV(filtered)}
            disabled={!filtered.length}
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportExpensesPDF(filtered)}
            disabled={!filtered.length}
          >
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="ft-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-expense-soft/60 hover:bg-expense-soft/60">
              <TableHead>
                <button
                  onClick={() => setSortDesc((v) => !v)}
                  className="inline-flex items-center gap-1 font-semibold text-foreground"
                >
                  Date <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-foreground">Title</TableHead>
              <TableHead className="text-foreground">Category</TableHead>
              <TableHead className="text-foreground">Vendor</TableHead>
              <TableHead className="text-foreground">Method</TableHead>
              <TableHead className="text-right text-foreground">Amount</TableHead>
              <TableHead className="text-foreground">Doc</TableHead>
              <TableHead className="w-[100px] text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No expense entries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((i, idx) => (
                <TableRow key={i.id} className={idx % 2 === 1 ? "bg-muted/20" : undefined}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{i.date}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    {i.title}
                    {i.isRecurring && (
                      <Badge variant="outline" className="ml-2 border-capital/30 bg-capital-soft text-capital">
                        <RotateCw className="mr-1 h-3 w-3" />
                        {i.recurrence ?? "Recurring"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{i.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.vendor ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{i.paymentMethod}</TableCell>
                  <TableCell className="text-right font-semibold text-expense">−{currency(i.amount)}</TableCell>
                  <TableCell>
                    {i.documentUrl ? (
                      <a
                        href={i.documentUrl}
                        download={i.documentName}
                        target="_blank"
                        rel="noreferrer"
                        title={i.documentName}
                        className="inline-flex max-w-[140px] items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-xs font-medium text-primary transition-smooth hover:bg-primary-soft"
                      >
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate">{i.documentName ?? "Attachment"}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(i)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPendingDelete(i)}
                        aria-label="Delete"
                        className="text-expense hover:text-expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={async (values) => {
          try {
            if (editing) await update(editing.id, values);
            else if (currentOrgId && user) await add(currentOrgId, user.id, values);
          } catch (e: any) {
            toast.error(e.message ?? "Failed to save");
          }
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `"${pendingDelete.title}" — ${currency(pendingDelete.amount)}` : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  if (pendingDelete.documentPath) {
                    void deleteExpenseAttachment(pendingDelete.documentPath).catch(() => {});
                  }
                  await remove(pendingDelete.id);
                  toast.success("Expense deleted");
                  setPendingDelete(null);
                } catch (e: any) {
                  toast.error(e.message ?? "Failed to delete");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}