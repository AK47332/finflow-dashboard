import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicStorefront } from "@/hooks/usePublicStorefront";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontLayout } from "@/components/storefront/StorefrontLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Package, MapPin, User as UserIcon, LogOut, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};
type Address = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
};

export default function CustomerAccountPage() {
  const { user, signOut } = useAuth();
  const { settings, loading: sLoading } = usePublicStorefront();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "orders";

  if (sLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!settings || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Please sign in to view your account.</p>
          <Button asChild className="mt-4">
            <Link to="/auth?customer=1">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const orgId = settings.organization_id;
  const storeName = settings.store_name ?? "Store";

  return (
    <StorefrontLayout orgId={orgId} storeName={storeName} storeLogoUrl={settings.store_logo_url}>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside>
            <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-card p-2 md:flex-col">
              {[
                { id: "orders", label: "Orders", Icon: Package },
                { id: "profile", label: "Profile", Icon: UserIcon },
                { id: "addresses", label: "Addresses", Icon: MapPin },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    const np = new URLSearchParams(params);
                    np.set("tab", id);
                    setParams(np);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    tab === id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="rounded-2xl border border-border/60 bg-card p-5">
            {tab === "orders" && <OrdersTab orgId={orgId} userId={user.id} />}
            {tab === "profile" && <ProfileTab orgId={orgId} userId={user.id} />}
            {tab === "addresses" && <AddressesTab orgId={orgId} userId={user.id} />}
          </section>
        </div>
      </div>
    </StorefrontLayout>
  );
}

function OrdersTab({ orgId, userId }: { orgId: string; userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: cust } = await supabase
        .from("ecom_customers")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!cust) {
        if (!cancelled) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("ecom_orders")
        .select("id, order_number, status, payment_status, total, created_at")
        .eq("customer_id", cust.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setOrders((data as Order[]) ?? []);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId, userId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (orders.length === 0) {
    return (
      <div className="py-10 text-center">
        <Package className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No orders yet.</p>
        <Button asChild className="mt-4">
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">Orders</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2">Order #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border/60">
                <td className="py-3 font-semibold">{o.order_number}</td>
                <td className="text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
                <td>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs capitalize">{o.status}</span>
                </td>
                <td className="text-xs capitalize text-muted-foreground">{o.payment_status}</td>
                <td className="text-right font-bold">${Number(o.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProfileTab({ orgId, userId }: { orgId: string; userId: string }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("ecom_customers")
        .select("full_name, email, phone")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (!cancelled && data) setForm({ full_name: data.full_name ?? "", email: data.email ?? "", phone: data.phone ?? "" });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [orgId, userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("ecom_customers")
      .upsert(
        {
          user_id: userId,
          organization_id: orgId,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
        },
        { onConflict: "user_id,organization_id" },
      );
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <h2 className="text-base font-semibold">Profile</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
      </Button>
    </form>
  );
}

function AddressesTab({ orgId, userId }: { orgId: string; userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });

  const load = async () => {
    const { data: cust } = await supabase
      .from("ecom_customers")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!cust) {
      setAddresses([]);
      return;
    }
    const { data } = await supabase
      .from("ecom_addresses")
      .select("*")
      .eq("customer_id", cust.id)
      .order("is_default", { ascending: false });
    setAddresses((data as Address[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, [orgId, userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let { data: cust } = await supabase
      .from("ecom_customers")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!cust) {
      const { data: created, error } = await supabase
        .from("ecom_customers")
        .insert({ user_id: userId, organization_id: orgId, full_name: form.full_name })
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      cust = created;
    }
    const { error } = await supabase.from("ecom_addresses").insert({
      customer_id: cust.id,
      organization_id: orgId,
      ...form,
      is_default: addresses.length === 0,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Address added");
      setAdding(false);
      setForm({ ...form, line1: "", line2: "", city: "" });
      void load();
    }
  };

  const remove = async (id: string) => {
    await supabase.from("ecom_addresses").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Addresses</h2>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        )}
      </div>

      {addresses.length === 0 && !adding && (
        <p className="py-8 text-center text-sm text-muted-foreground">No saved addresses.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-xl border border-border/60 p-4 text-sm">
            <div className="flex items-start justify-between">
              <div className="font-semibold">{a.label ?? a.full_name}</div>
              <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 text-muted-foreground">
              {a.full_name}
              <br />
              {a.line1}
              {a.line2 && <>, {a.line2}</>}
              <br />
              {a.city}, {a.state} {a.postal_code}
              <br />
              {a.country}
              {a.phone && <><br />{a.phone}</>}
            </div>
            {a.is_default && <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase">Default</span>}
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={save} className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Full name *</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Country *</Label><Input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Line 1 *</Label><Input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Line 2</Label><Input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>City *</Label><Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Postal code</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}