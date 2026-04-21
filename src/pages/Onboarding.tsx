import { useState } from "react";
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
import { Building2, Loader2, LogOut } from "lucide-react";
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