import { useStoreLink } from "@/contexts/StorefrontBasePath";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { currency } from "@/lib/format";

export function StorefrontCheckout({ orgId }: { orgId: string }) {
  const storeLink = useStoreLink();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clear = useCartStore((s) => s.clear);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    line1: "",
    notes: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, email: user?.email ?? f.email }));
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link to={storeLink("/shop")}>Browse products</Link>
        </Button>
      </div>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // ===== Guest checkout (no logged-in user) =====
      // We delegate to a service-role edge function so RLS doesn't block
      // creating the customer/order. The function also auto-creates an
      // auth account for this email so the order is tied to a real customer.
      if (!user) {
        const { data, error } = await supabase.functions.invoke(
          "ecom-guest-checkout",
          {
            body: {
              organization_id: orgId,
              full_name: form.full_name,
              email: form.email,
              phone: form.phone,
              line1: form.line1,
              notes: form.notes,
              items: items.map((it) => ({
                product_id: it.product_id,
                product_name: it.name,
                product_sku: it.sku,
                unit_price: it.unit_price,
                quantity: it.quantity,
              })),
            },
          },
        );
        if (error) throw error;
        const payload = data as { order_number?: string; error?: unknown } | null;
        if (payload?.error) throw new Error(String(payload.error));
        clear();
        toast.success(
          `Order placed! Reference: ${payload?.order_number ?? "saved"}`,
        );
        navigate(storeLink("/"));
        return;
      }

      // ===== Logged-in customer path (unchanged) =====
      // Ensure ecom_customer record
      let customerId: string;
      const { data: existing } = await supabase
        .from("ecom_customers")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created, error } = await supabase
          .from("ecom_customers")
          .insert({
            user_id: user.id,
            organization_id: orgId,
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
          })
          .select("id")
          .single();
        if (error) throw error;
        customerId = created.id;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const total = subtotal;

      const { data: order, error: orderErr } = await supabase
        .from("ecom_orders")
        .insert({
          organization_id: orgId,
          customer_id: customerId,
          order_number: orderNumber,
          status: "pending",
          payment_status: "unpaid",
          payment_method: "cod",
          contact_email: form.email,
          contact_phone: form.phone,
          shipping_full_name: form.full_name,
          shipping_line1: form.line1,
          shipping_line2: null,
          shipping_city: "",
          shipping_state: null,
          shipping_postal_code: null,
          shipping_country: "",
          subtotal,
          shipping_fee: 0,
          tax: 0,
          total,
          notes: form.notes,
        })
        .select("id, order_number")
        .single();
      if (orderErr) throw orderErr;

      const lines = items.map((it) => ({
        order_id: order.id,
        product_id: it.product_id,
        product_name: it.name,
        product_sku: it.sku,
        unit_price: it.unit_price,
        quantity: it.quantity,
        line_total: it.unit_price * it.quantity,
      }));
      const { error: itemsErr } = await supabase.from("ecom_order_items").insert(lines);
      if (itemsErr) throw itemsErr;

      clear();
      toast.success("Order placed! We'll contact you soon.");
      navigate(`/account?tab=orders`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-base font-semibold">Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Email" required>
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone" required>
                <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-base font-semibold">Shipping address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Full Address" required>
                  <Input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-base font-semibold">Order notes</h2>
            <Textarea
              className="mt-3"
              placeholder="Anything we should know?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="text-base font-semibold">Payment</h2>
            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm">
              <div className="font-semibold">Cash on Delivery</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Pay when you receive your order. Online payments coming soon.
              </p>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="text-base font-semibold">Your order</h2>
          <div className="space-y-2 text-sm">
            {items.map((it) => (
              <div key={it.product_id} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-muted-foreground">
                  {it.name} × {it.quantity}
                </span>
                <span className="shrink-0 font-semibold">
                  {currency(it.unit_price * it.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{currency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">Free</span>
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{currency(subtotal)}</span>
          </div>
          <Button type="submit" className="mt-4 w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place order"}
          </Button>
          <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Secure & encrypted
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}