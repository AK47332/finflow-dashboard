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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  type Income,
  type IncomeType,
  type PaymentMethod,
} from "@/store/incomeStore";
import { toast } from "sonner";
import { uploadIncomeAttachment, deleteIncomeAttachment } from "@/lib/storage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Income | null;
  onSubmit: (values: Omit<Income, "id">) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export function IncomeFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(today());
  const [type, setType] = useState<IncomeType>("General");
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [client, setClient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Bank Transfer");
  const [description, setDescription] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [remainingDue, setRemainingDue] = useState("");
  const [tags, setTags] = useState("");
  const [documentName, setDocumentName] = useState<string | undefined>(undefined);
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);
  const [documentPath, setDocumentPath] = useState<string | undefined>(undefined);
  const [documentUrl, setDocumentUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  // Track newly uploaded paths within this session so we can clean up if user cancels
  const newlyUploadedRef = useRef<string[]>([]);
  const initialPathRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setAmount(initial?.amount?.toString() ?? "");
      setDate(initial?.date ?? today());
      setType(initial?.type ?? "General");
      setCategory(initial?.category ?? INCOME_CATEGORIES[0]);
      setClient(initial?.client ?? "");
      setPaymentMethod(initial?.paymentMethod ?? "Bank Transfer");
      setDescription(initial?.description ?? "");
      setIsPartial(initial?.isPartial ?? false);
      setRemainingDue(initial?.remainingDue?.toString() ?? "");
      setTags(initial?.tags?.join(", ") ?? "");
      setDocumentName(initial?.documentName);
      setDocumentType(initial?.documentType);
      setDocumentPath(initial?.documentPath);
      setDocumentUrl(initial?.documentUrl);
      newlyUploadedRef.current = [];
      initialPathRef.current = initial?.documentPath;
    }
  }, [open, initial]);

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
      type,
      category,
      client: client.trim() || undefined,
      paymentMethod,
      description: description.trim() || undefined,
      isPartial,
      remainingDue: isPartial ? parseFloat(remainingDue) || 0 : undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      documentName,
      documentType,
      documentPath,
      documentUrl,
    });
    // If we replaced an existing attachment, clean up the previous one in storage
    if (initialPathRef.current && initialPathRef.current !== documentPath) {
      void deleteIncomeAttachment(initialPathRef.current).catch(() => {});
    }
    // Don't delete uploads we are keeping
    newlyUploadedRef.current = [];
    onOpenChange(false);
    toast.success(initial ? "Income updated" : "Income added");
  };

  const handleClose = (next: boolean) => {
    if (!next && !uploading) {
      // User cancelled — remove any uploads they made this session that aren't being saved
      const orphans = newlyUploadedRef.current.filter((p) => p !== initialPathRef.current);
      orphans.forEach((p) => void deleteIncomeAttachment(p).catch(() => {}));
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
      // If we just uploaded another file in this session, remove it first to avoid orphans
      if (documentPath && documentPath !== initialPathRef.current) {
        await deleteIncomeAttachment(documentPath).catch(() => {});
        newlyUploadedRef.current = newlyUploadedRef.current.filter((p) => p !== documentPath);
      }
      const uploaded = await uploadIncomeAttachment(file);
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
    // Only delete from storage immediately if it's a brand-new upload from this session.
    // For existing attachments, defer deletion until the form is saved.
    if (documentPath !== initialPathRef.current) {
      await deleteIncomeAttachment(documentPath).catch(() => {});
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
          <DialogTitle>{initial ? "Edit Income" : "Add Income"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Website redesign" />
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

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as IncomeType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="General">General</TabsTrigger>
                <TabsTrigger value="Product">Product</TabsTrigger>
                <TabsTrigger value="Service">Service</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCOME_CATEGORIES.map((c) => (
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
            <Label htmlFor="client">Client</Label>
            <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Acme Co." />
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
              <Label htmlFor="partial" className="text-sm">Partial payment</Label>
              <p className="text-xs text-muted-foreground">Track remaining balance owed.</p>
            </div>
            <Switch id="partial" checked={isPartial} onCheckedChange={setIsPartial} />
          </div>

          {isPartial && (
            <div className="space-y-1.5">
              <Label htmlFor="remaining">Remaining due</Label>
              <Input
                id="remaining"
                type="number"
                step="0.01"
                min="0"
                value={remainingDue}
                onChange={(e) => setRemainingDue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="retainer, q2, priority"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          <div className="space-y-1.5">
            <Label>Attachment</Label>
            {documentDataUrl ? (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {documentName}
                  </span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setDocumentName(undefined);
                    setDocumentDataUrl(undefined);
                    setDocumentType(undefined);
                  }}
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
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File too large (max 5 MB)");
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setDocumentDataUrl(reader.result as string);
                      setDocumentName(file.name);
                      setDocumentType(file.type);
                    };
                    reader.onerror = () => toast.error("Failed to read file");
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">Image or PDF, up to 5 MB.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-income text-income-foreground hover:opacity-90">
              {initial ? "Save changes" : "Add Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}