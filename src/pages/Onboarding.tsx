import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2, LogOut, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "BDT", "AUD", "CAD", "JPY", "CNY"];

export default function OnboardingPage() {
  const { user, signOut } = useAuth();
  const { refresh } = useOrg();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancel = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("invitations")
        .select("id, organization_id, role, status, expires_at, organization:organizations(name, logo_url)")
        .eq("status", "pending")
        .ilike("email", user.email);
      if (!cancel) setInvites(data ?? []);
    })();
    return () => {
      cancel = true;
    };
  }, [user?.email]);

  const acceptInvite = async (inv: any) => {
    if (!user) return;
    setAcceptingId(inv.id);
    // Add the user as a member with the invited role
    const { error: memErr } = await supabase.from("organization_members").insert({
      organization_id: inv.organization_id,
      user_id: user.id,
      role: inv.role,
    });
    if (memErr && !memErr.message.includes("duplicate")) {
      setAcceptingId(null);
      return toast.error(memErr.message);
    }
    await (supabase as any)
      .from("invitations")
      .update({ status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() })
      .eq("id", inv.id);
    await supabase.from("profiles").update({ current_org_id: inv.organization_id }).eq("user_id", user.id);
    await refresh();
    setAcceptingId(null);
    toast.success(`Joined ${inv.organization?.name ?? "workspace"}!`);
    navigate("/", { replace: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Business name is required");
    setBusy(true);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) + "-" + crypto.randomUUID().slice(0, 6);
    const { error } = await supabase.from("organizations").insert({
      name: name.trim(),
      slug,
      currency,
      created_by: user.id,
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    await refresh();
    setBusy(false);
    toast.success("Workspace created!");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-soft via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your workspace</h1>
          <p className="text-sm text-muted-foreground">
            Each workspace has its own private books, clients and team.
          </p>
        </div>

        {invites.length > 0 && (
          <div className="ft-card mb-4 space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> Invitations for you
            </div>
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg bg-primary-soft/50 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {inv.organization?.name ?? "Workspace"}
                  </p>
                  <p className="text-xs text-muted-foreground">Invited as {inv.role}</p>
                </div>
                <Button size="sm" onClick={() => acceptInvite(inv)} disabled={acceptingId === inv.id}>
                  {acceptingId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Accept"}
                </Button>
              </div>
            ))}
            <p className="text-center text-xs text-muted-foreground">— or create your own —</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="ft-card space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Business name *</Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Trading Co."
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create workspace"}
          </Button>

          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}