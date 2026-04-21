import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrgTable } from "@/hooks/useOrgTable";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIncomeStore, PAYMENT_METHODS, PaymentMethod } from "@/store/incomeStore";
import { supabase } from "@/integrations/supabase/client";
import { currency } from "@/lib/format";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  stock: number;
  unit: string | null;
  description: string | null;
};

type CartLine = {
  productId: string;
  name: string;
  sku: string | null;
  unit: string | null;
  originalPrice: number;
  price: number;        // price actually used
  useCustom: boolean;   // toggle between original / custom
  qty: number;
  stock: number;        // remaining stock for validation
};

type Receipt = {
  number: string;
  date: string;
  lines: CartLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: PaymentMethod;
  client?: string;
  note?: string;
  orgName?: string;
};

export default function PosPage() {
  const { rows: products, loading, refetch } = useOrgTable<Product>("products", {
    column: "name",
    ascending: true,
  });
  const { currentOrg, currentOrgId } = useOrg();
  const { user } = useAuth();
  const addIncome = useIncomeStore((s) => s.add);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("");          // optional
  const [taxPct, setTaxPct] = useState("");              // optional
  const [paid, setPaid] = useState("");                  // optional (defaults to total)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [client, setClient] = useState("");              // optional
  const [note, setNote] = useState("");                  // optional
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [products, search]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        const line = { ...next[idx] };
        if (line.qty + 1 > line.stock && line.stock > 0) {
          toast.warning(`Only ${line.stock} in stock`);
          return prev;
        }
        line.qty += 1;
        next[idx] = line;
        return next;
      }
      if (p.stock <= 0) {
        toast.warning(`${p.name} is out of stock`);
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          originalPrice: Number(p.price) || 0,
          price: Number(p.price) || 0,
          useCustom: false,
          qty: 1,
          stock: Number(p.stock) || 0,
        },
      ];
    });
  };

  const updateLine = (productId: string, patch: Partial<CartLine>) => {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)),
    );
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const next = l.qty + delta;
          if (next < 1) return l;
          if (l.stock > 0 && next > l.stock) {
            toast.warning(`Only ${l.stock} in stock`);
            return l;
          }
          return { ...l, qty: next };
        }),
    );
  };

  const removeLine = (productId: string) =>
    setCart((prev) => prev.filter((l) => l.productId !== productId));

  const togglePriceMode = (productId: string, useCustom: boolean) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        // when switching back to original, restore originalPrice
        return {
          ...l,
          useCustom,
          price: useCustom ? l.price : l.originalPrice,
        };
      }),
    );
  };

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const afterDiscount = Math.max(0, subtotal - discountNum);
  const taxNum = Math.max(0, parseFloat(taxPct) || 0);
  const taxAmount = (afterDiscount * taxNum) / 100;
  const total = afterDiscount + taxAmount;
  const paidNum = paid === "" ? total : Math.max(0, parseFloat(paid) || 0);
  const due = Math.max(0, total - paidNum);

  const clearCart = () => {
    setCart([]);
    setDiscount("");
    setTaxPct("");
    setPaid("");
    setClient("");
    setNote("");
    setPaymentMethod("Cash");
  };

  const checkout = async () => {
    if (!currentOrgId || !user) {
      toast.error("No organization selected");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (total <= 0) {
      toast.error("Total must be greater than zero");
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const itemSummary = cart
        .map((l) => `${l.name} x${l.qty} @ ${currency(l.price)}`)
        .join(", ");
      const tags = ["pos"];
      if (discountNum > 0) tags.push(`discount:${discountNum}`);
      if (taxNum > 0) tags.push(`tax:${taxNum}%`);

      const description =
        `POS Sale\nItems: ${itemSummary}` +
        (note.trim() ? `\nNote: ${note.trim()}` : "");

      const isPartial = due > 0.0001;

      // 1. Save Income row
      await addIncome(currentOrgId, user.id, {
        title: `POS Sale (${cart.length} item${cart.length > 1 ? "s" : ""})`,
        amount: isPartial ? paidNum : total,
        date: today,
        type: "Product",
        category: "Sales",
        client: client.trim() || undefined,
        paymentMethod,
        description,
        isPartial,
        remainingDue: isPartial ? due : undefined,
        tags,
      });

      // 2. Decrement stock per line (only for products with positive stock tracking)
      await Promise.all(
        cart.map(async (l) => {
          const newStock = Math.max(0, l.stock - l.qty);
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", l.productId);
        }),
      );

      // 3. Build receipt
      const number = `POS-${Date.now().toString().slice(-8)}`;
      setReceipt({
        number,
        date: today,
        lines: cart,
        subtotal,
        discount: discountNum,
        tax: taxAmount,
        total,
        paid: isPartial ? paidNum : total,
        due: isPartial ? due : 0,
        paymentMethod,
        client: client.trim() || undefined,
        note: note.trim() || undefined,
        orgName: currentOrg?.name,
      });

      toast.success("Sale recorded");
      clearCart();
      void refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="ft-page-pos space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Point of Sale
          </h1>
          <p className="text-sm text-muted-foreground">
            Quick checkout — toggle between original and custom price per item.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
        {/* LEFT — Product picker */}
        <div className="space-y-4">
          <div className="ft-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="ft-card p-3">
            {loading ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {products.length === 0
                    ? "No products yet. Add some on the Products page."
                    : "No products match your search."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => {
                  const out = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left transition-smooth hover:border-primary hover:shadow-soft"
                    >
                      <div className="line-clamp-2 text-sm font-semibold text-foreground">
                        {p.name}
                      </div>
                      {p.sku && (
                        <div className="text-[11px] text-muted-foreground">
                          {p.sku}
                        </div>
                      )}
                      <div className="mt-auto flex w-full items-center justify-between pt-2">
                        <span className="text-sm font-bold text-primary">
                          {currency(p.price)}
                        </span>
                        <span
                          className={
                            out
                              ? "text-[11px] font-medium text-expense"
                              : "text-[11px] text-muted-foreground"
                          }
                        >
                          {out ? "Out" : `${p.stock} ${p.unit ?? ""}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Cart */}
        <div className="space-y-4">
          <div className="ft-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Cart ({cart.length})
                </span>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-expense hover:text-expense"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="max-h-[42vh] divide-y divide-border overflow-y-auto">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Add items from the left to get started.
                </div>
              ) : (
                cart.map((l) => (
                  <div key={l.productId} className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {l.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Original: {currency(l.originalPrice)}
                          {l.unit ? ` · ${l.unit}` : ""}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-expense hover:text-expense"
                        onClick={() => removeLine(l.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={l.useCustom}
                          onCheckedChange={(v) => togglePriceMode(l.productId, v)}
                        />
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {l.useCustom ? "Custom price" : "Original price"}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!l.useCustom}
                        value={l.price}
                        onChange={(e) =>
                          updateLine(l.productId, {
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-8 w-28 text-right text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-md border border-input">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-none"
                          onClick={() => changeQty(l.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={l.qty}
                          onChange={(e) => {
                            const n = parseInt(e.target.value) || 1;
                            updateLine(l.productId, { qty: Math.max(1, n) });
                          }}
                          className="h-7 w-12 rounded-none border-0 text-center text-sm focus-visible:ring-0"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-none"
                          onClick={() => changeQty(l.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {currency(l.price * l.qty)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals + optional fields */}
          <div className="ft-card space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tax % (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Payment</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount paid (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={total.toFixed(2)}
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Client (optional)</Label>
              <Input
                placeholder="Walk-in customer"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Add any note for this sale…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
              <Row label="Subtotal" value={currency(subtotal)} />
              {discountNum > 0 && (
                <Row label="Discount" value={`- ${currency(discountNum)}`} />
              )}
              {taxNum > 0 && (
                <Row label={`Tax (${taxNum}%)`} value={currency(taxAmount)} />
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{currency(total)}</span>
              </div>
              {due > 0.0001 && (
                <Row
                  label="Due (partial)"
                  value={currency(due)}
                  className="text-expense"
                />
              )}
            </div>

            <Button
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              size="lg"
              disabled={submitting || cart.length === 0}
              onClick={checkout}
            >
              {submitting ? "Processing…" : `Charge ${currency(total)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt dialog */}
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-md print:max-w-none print:border-0 print:shadow-none">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div id="pos-receipt" className="space-y-3 text-sm">
              <div className="text-center">
                <div className="text-base font-bold">
                  {receipt.orgName ?? "Receipt"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {receipt.number} · {receipt.date}
                </div>
              </div>
              <div className="border-y border-dashed border-border py-2">
                {receipt.lines.map((l) => (
                  <div key={l.productId} className="flex justify-between gap-2 py-0.5">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{l.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {l.qty} × {currency(l.price)}
                        {l.useCustom && l.price !== l.originalPrice
                          ? ` (custom, was ${currency(l.originalPrice)})`
                          : ""}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {currency(l.price * l.qty)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Row label="Subtotal" value={currency(receipt.subtotal)} />
                {receipt.discount > 0 && (
                  <Row label="Discount" value={`- ${currency(receipt.discount)}`} />
                )}
                {receipt.tax > 0 && <Row label="Tax" value={currency(receipt.tax)} />}
                <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{currency(receipt.total)}</span>
                </div>
                <Row label={`Paid (${receipt.paymentMethod})`} value={currency(receipt.paid)} />
                {receipt.due > 0 && (
                  <Row label="Due" value={currency(receipt.due)} className="text-expense" />
                )}
              </div>
              {receipt.client && (
                <div className="text-xs text-muted-foreground">
                  Client: {receipt.client}
                </div>
              )}
              {receipt.note && (
                <div className="text-xs text-muted-foreground">
                  Note: {receipt.note}
                </div>
              )}
              <div className="pt-2 text-center text-[11px] text-muted-foreground">
                Thank you!
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 print:hidden">
            <Button variant="outline" onClick={() => setReceipt(null)}>
              Close
            </Button>
            <Button onClick={printReceipt}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}