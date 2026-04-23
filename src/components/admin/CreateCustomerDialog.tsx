import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().max(120).optional(),
  organization_name: z.string().trim().max(120).optional(),
  expiry_days: z.number().int().min(1).max(3650),
  notes: z.string().trim().max(1000).optional(),
});

function generatePassword(len = 14) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setOrgName("");
    setExpiryDays(30);
    setNotes("");
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse({
      email,
      password,
      full_name: fullName || undefined,
      organization_name: orgName || undefined,
      expiry_days: expiryDays,
      notes: notes || undefined,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Invalid input");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke(
      "admin-create-customer",
      { body: parsed.data },
    );
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Failed to create customer");
      return;
    }
    if (data && (data as { error?: unknown }).error) {
      toast.error("Failed to create customer");
      return;
    }
    toast.success("Customer created");
    onCreated();
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add admin</DialogTitle>
          <DialogDescription>
            Create a new admin account. A workspace will be created automatically and the
            admin will get full dashboard access (except creating other admins).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-pass">Password</Label>
            <div className="flex gap-2">
              <Input
                id="c-pass"
                type="text"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassword(generatePassword())}
                title="Generate password"
              >
                <Wand2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!password}
                onClick={async () => {
                  await navigator.clipboard.writeText(password);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                title="Copy password"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Full name (optional)</Label>
              <Input
                id="c-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-days">Package length (days)</Label>
              <Input
                id="c-days"
                type="number"
                min={1}
                max={3650}
                required
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-org">Workspace name (optional)</Label>
            <Input
              id="c-org"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Leave blank to auto-name from full name or email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Notes (optional)</Label>
            <Textarea
              id="c-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}