import { useEffect, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  contact_email: string | null;
  contact_phone: string | null;
  shipping_full_name: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  notes: string | null;
  created_at: string;
};
type OrderItem = {
  id: string;
  product_name: string;
  product_sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

const STATUSES = ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled", "returned"];
const PAY_STATUSES = ["unpaid", "paid", "refunded"];

export default function EcomOrdersPage() {
  const { currentOrgId } = useOrg();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  const load = async () => {
    if (!currentOrgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecom_orders")
      .select("*")
      .eq("organization_id", currentOrgId)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Orders — Admin";
    void load();
  }, [currentOrgId]);

  const openOrder = async (o: Order) => {
    setSelected(o);
    const { data } = await supabase
      .from("ecom_order_items")
      .select("*")
      .eq("order_id", o.id);
    setItems((data as OrderItem[]) ?? []);
  };

  const updateStatus = async (id: string, field: "status" | "payment_status", value: string) => {
    const update: any = { [field]: value };
    const { error } = await supabase.from("ecom_orders").update(update).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order updated");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
    if (selected?.id === id) setSelected({ ...selected, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length} orders</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-semibold">{o.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{o.shipping_full_name ?? o.contact_email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, "status", e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.payment_status}
                      onChange={(e) => updateStatus(o.id, "payment_status", e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize"
                    >
                      {PAY_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => openOrder(o)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Customer</div>
                  <div className="mt-1">{selected.shipping_full_name}</div>
                  <div className="text-muted-foreground">{selected.contact_email}</div>
                  <div className="text-muted-foreground">{selected.contact_phone}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Shipping</div>
                  <div className="mt-1 text-muted-foreground">
                    {selected.shipping_line1}
                    {selected.shipping_line2 && <>, {selected.shipping_line2}</>}<br />
                    {selected.shipping_city}, {selected.shipping_state} {selected.shipping_postal_code}<br />
                    {selected.shipping_country}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t border-border/60">
                        <td className="px-3 py-2">{it.product_name}{it.product_sku && <span className="ml-1 text-xs text-muted-foreground">({it.product_sku})</span>}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">${Number(it.unit_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">${Number(it.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between border-t border-border/60 pt-3 text-base font-bold">
                <span>Total</span>
                <span>${Number(selected.total).toFixed(2)}</span>
              </div>

              {selected.notes && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Notes</div>
                  <p className="mt-1 text-muted-foreground">{selected.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}