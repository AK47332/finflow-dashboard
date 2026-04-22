import { useEffect, useMemo, useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Search, Eye, ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

type EcomCustomer = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type CustomerStats = {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
};

type EcomAddress = {
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

type EcomOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
};

export default function EcomCustomersPage() {
  const { currentOrgId } = useOrg();
  const [customers, setCustomers] = useState<EcomCustomer[]>([]);
  const [stats, setStats] = useState<Record<string, CustomerStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EcomCustomer | null>(null);
  const [addresses, setAddresses] = useState<EcomAddress[]>([]);
  const [orders, setOrders] = useState<EcomOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    document.title = "Ecommerce Customers — Admin";
  }, []);

  useEffect(() => {
    if (!currentOrgId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: cust } = await supabase
        .from("ecom_customers")
        .select("id,user_id,full_name,email,phone,created_at")
        .eq("organization_id", currentOrgId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const list = (cust ?? []) as EcomCustomer[];
      setCustomers(list);
      // Load aggregate stats from orders
      const { data: ords } = await supabase
        .from("ecom_orders")
        .select("customer_id,total,created_at")
        .eq("organization_id", currentOrgId);
      const map: Record<string, CustomerStats> = {};
      (ords ?? []).forEach((o: any) => {
        if (!o.customer_id) return;
        const cur = map[o.customer_id] ?? { order_count: 0, total_spent: 0, last_order_at: null };
        cur.order_count += 1;
        cur.total_spent += Number(o.total ?? 0);
        if (!cur.last_order_at || new Date(o.created_at) > new Date(cur.last_order_at)) {
          cur.last_order_at = o.created_at;
        }
        map[o.customer_id] = cur;
      });
      if (!cancelled) {
        setStats(map);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentOrgId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  const openDetails = async (c: EcomCustomer) => {
    setSelected(c);
    setDetailLoading(true);
    const [addrRes, ordRes] = await Promise.all([
      supabase
        .from("ecom_addresses")
        .select("id,label,full_name,phone,line1,line2,city,state,postal_code,country,is_default")
        .eq("customer_id", c.id)
        .order("is_default", { ascending: false }),
      supabase
        .from("ecom_orders")
        .select("id,order_number,status,payment_status,total,created_at")
        .eq("customer_id", c.id)
        .order("created_at", { ascending: false }),
    ]);
    setAddresses((addrRes.data ?? []) as EcomAddress[]);
    setOrders((ordRes.data ?? []) as EcomOrder[]);
    setDetailLoading(false);
  };

  const totalCustomers = customers.length;
  const totalRevenue = Object.values(stats).reduce((s, v) => s + v.total_spent, 0);
  const totalOrders = Object.values(stats).reduce((s, v) => s + v.order_count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ecommerce Customers</h1>
        <p className="text-muted-foreground">Shoppers who have signed up to your storefront.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customers</CardDescription>
            <CardTitle className="text-3xl">{totalCustomers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Orders placed</CardDescription>
            <CardTitle className="text-3xl">{totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime revenue</CardDescription>
            <CardTitle className="text-3xl">${totalRevenue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>All customers</CardTitle>
            <CardDescription>Search by name, email, or phone.</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No ecommerce customers yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead>Last order</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const s = stats[c.id] ?? { order_count: 0, total_spent: 0, last_order_at: null };
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>}
                            {c.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={s.order_count > 0 ? "default" : "secondary"}>
                            {s.order_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${s.total_spent.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.last_order_at ? format(new Date(s.last_order_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(c.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openDetails(c)}>
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.full_name || "Customer"}</DialogTitle>
            <DialogDescription>
              {selected?.email}
              {selected?.phone ? ` · ${selected.phone}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4" /> Saved addresses ({addresses.length})
                </h3>
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No addresses saved.</p>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <div key={a.id} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{a.full_name}</div>
                          {a.is_default && <Badge variant="secondary">Default</Badge>}
                        </div>
                        <div className="text-muted-foreground">
                          {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                          <br />
                          {a.city}{a.state ? `, ${a.state}` : ""} {a.postal_code} · {a.country}
                        </div>
                        {a.phone && <div className="text-xs text-muted-foreground">📞 {a.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ShoppingBag className="h-4 w-4" /> Order history ({orders.length})
                </h3>
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                          <TableCell className="text-xs">{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{o.payment_status}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">${Number(o.total).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}