import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Paperclip, X, FileText, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type Expense,
  type PaymentMethod,
  type RecurrenceFrequency,
} from "@/store/expenseStore";
import { toast } from "sonner";
import { uploadExpenseAttachment, deleteExpenseAttachment } from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Expense | null;
  onSubmit: (values: Omit<Expense, "id">) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

const RECURRENCES: RecurrenceFrequency[] = ["Daily", "Weekly", "Monthly", "Yearly"];

function computeNextDue(date: string, freq: RecurrenceFrequency): string {
  const d = new Date(date);
  if (freq === "Daily") d.setDate(d.getDate() + 1);
  if (freq === "Weekly") d.setDate(d.getDate() + 7);
  if (freq === "Monthly") d.setMonth(d.getMonth() + 1);
  if (freq === "Yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function ExpenseFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(today());
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>("Monthly");
  const [tags, setTags] = useState("");
  const [documentName, setDocumentName] = useState<string | undefined>(undefined);
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);
  const [documentPath, setDocumentPath] = useState<string | undefined>(undefined);
  const [documentUrl, setDocumentUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const newlyUploadedRef = useRef<string[]>([]);
  const initialPathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setAmount(initial?.amount?.toString() ?? "");
      setDate(initial?.date ?? today());
      setCategory(initial?.category ?? EXPENSE_CATEGORIES[0]);
      setVendor(initial?.vendor ?? "");
      setPaymentMethod(initial?.paymentMethod ?? "Card");
      setDescription(initial?.description ?? "");
      setIsRecurring(initial?.isRecurring ?? false);
      setRecurrence(initial?.recurrence ?? "Monthly");
      setTags(initial?.tags?.join(", ") ?? "");
      setDocumentName(initial?.documentName);
      setDocumentType(initial?.documentType);
      setDocumentPath(initial?.documentPath);
      setDocumentUrl(initial?.documentUrl);
      newlyUploadedRef.current = [];
      initialPathRef.current = initial?.documentPath;
    }
  }, [open, initial]);

  const nextDue = isRecurring && date ? computeNextDue(date, recurrence) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return toast.error("Please wait for the upload to finish");
    const amt = parseFloat(amount);
    if (!title.trim()) return toast.error("Title is required");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!date) return toast.error("Date is required");

    onSubmit({
      title: title.trim(),
      amount: amt,
      date,
      category,
      vendor: vendor.trim() || undefined,
      paymentMethod,
      description: description.trim() || undefined,
      isRecurring,
      recurrence: isRecurring ? recurrence : undefined,
      nextDueDate: nextDue,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      documentName,
      documentType,
      documentPath,
      documentUrl,
    });

    if (initialPathRef.current && initialPathRef.current !== documentPath) {
      void deleteExpenseAttachment(initialPathRef.current).catch(() => {});
    }
    newlyUploadedRef.current = [];
    onOpenChange(false);
    toast.success(initial ? "Expense updated" : "Expense added");
  };

  const handleClose = (next: boolean) => {
    if (!next && !uploading) {
      const orphans = newlyUploadedRef.current.filter((p) => p !== initialPathRef.current);
      orphans.forEach((p) => void deleteExpenseAttachment(p).catch(() => {}));
      newlyUploadedRef.current = [];
    }
    onOpenChange(next);
  };

  const handleFilePick = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large (max 5 MB)");
      return;
    }
    setUploading(true);
    try {
      if (documentPath && documentPath !== initialPathRef.current) {
        await deleteExpenseAttachment(documentPath).catch(() => {});
        newlyUploadedRef.current = newlyUploadedRef.current.filter((p) => p !== documentPath);
      }
      const uploaded = await uploadExpenseAttachment(file);
      setDocumentPath(uploaded.path);
      setDocumentUrl(uploaded.url);
      setDocumentName(uploaded.name);
      setDocumentType(uploaded.type);
      newlyUploadedRef.current.push(uploaded.path);
      toast.success("Attachment uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async () => {
    if (!documentPath) return;
    if (documentPath !== initialPathRef.current) {
      await deleteExpenseAttachment(documentPath).catch(() => {});
      newlyUploadedRef.current = newlyUploadedRef.current.filter((p) => p !== documentPath);
    }
    setDocumentPath(undefined);
    setDocumentUrl(undefined);
    setDocumentName(undefined);
    setDocumentType(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Office rent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vendor">Vendor / Supplier</Label>
            <Input id="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Acme Hosting" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
            <div>
              <Label htmlFor="recurring" className="text-sm">Recurring expense</Label>
              <p className="text-xs text-muted-foreground">Track repeating charges automatically.</p>
            </div>
            <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          {isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceFrequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Next due</Label>
                <Input value={nextDue ?? ""} readOnly className="bg-muted/40" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="utilities, office"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          <div className="space-y-1.5">
            <Label>Attachment</Label>
            {uploading ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Uploading…
              </div>
            ) : documentUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-foreground hover:text-primary"
                  >
                    {documentName}
                  </a>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => void handleRemoveAttachment()}
                  aria-label="Remove attachment"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:bg-primary-soft/40 hover:text-foreground">
                <Paperclip className="h-4 w-4" />
                <span>Click to attach receipt or document</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFilePick(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">Image or PDF, up to 5 MB. Saved to Lovable Cloud storage.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-expense text-expense-foreground hover:opacity-90">
              {initial ? "Save changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}