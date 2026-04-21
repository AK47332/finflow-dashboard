import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Paperclip, X, FileText } from "lucide-react";
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
  const [documentDataUrl, setDocumentDataUrl] = useState<string | undefined>(undefined);
  const [documentType, setDocumentType] = useState<string | undefined>(undefined);

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
      setDocumentDataUrl(initial?.documentDataUrl);
      setDocumentType(initial?.documentType);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      documentDataUrl,
      documentType,
    });
    onOpenChange(false);
    toast.success(initial ? "Income updated" : "Income added");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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