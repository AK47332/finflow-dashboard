import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, KeyRound, Calendar, Loader2, Search } from "lucide-react";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { CreateCustomerDialog } from "@/components/admin/CreateCustomerDialog";
import { ExtendExpiryDialog } from "@/components/admin/ExtendExpiryDialog";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";

type Customer = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  expires_at: string;
  notes: string | null;
  created_at: string;
};

function statusOf(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (ms <= 0) return { label: "Expired", variant: "destructive" as const, days };
  if (days <= 7) return { label: "Expiring", variant: "secondary" as const, days };
  return { label: "Active", variant: "default" as const, days };
}

export default function CustomersPage() {
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Customer | null>(null);
  const [resetTarget, setResetTarget] = useState<Customer | null>(null);

  useEffect(() => {
    document.title = "Create Admin — Super Admin";
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke(
      "admin-list-customers",
      { body: {} },
    );
    setLoading(false);
    if (error || !data) return;
    const payload = data as { customers?: Customer[] };
    setCustomers(payload.customers ?? []);
  };

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const s = statusOf(c.expires_at);
      if (statusFilter === "active" && s.label !== "Active") return false;
      if (statusFilter === "expiring" && s.label !== "Expiring") return false;
      if (statusFilter === "expired" && s.label !== "Expired") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.full_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customers, search, statusFilter]);

  if (saLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Admin</h1>
          <p className="text-sm text-muted-foreground">
            Create admin accounts with a dedicated workspace and manage package expiry.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All admin accounts</CardTitle>
          <CardDescription>
            {customers.length} {customers.length === 1 ? "admin" : "admins"} total
          </CardDescription>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring (≤7d)</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No customers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Days left</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const s = statusOf(c.expires_at);
                    return (
                      <TableRow key={c.user_id}>
                        <TableCell className="font-medium">{c.email ?? "—"}</TableCell>
                        <TableCell>{c.full_name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                        <TableCell>{new Date(c.expires_at).toLocaleDateString()}</TableCell>
                        <TableCell>{s.days <= 0 ? "—" : `${s.days}d`}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExtendTarget(c)}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Expiry
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setResetTarget(c)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Password
                            </Button>
                          </div>
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

      <CreateCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />
      <ExtendExpiryDialog
        open={!!extendTarget}
        onOpenChange={(v) => !v && setExtendTarget(null)}
        customer={extendTarget}
        onUpdated={load}
      />
      <ResetPasswordDialog
        open={!!resetTarget}
        onOpenChange={(v) => !v && setResetTarget(null)}
        customer={resetTarget}
      />
    </div>
  );
}