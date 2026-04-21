import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRESETS = [7, 30, 90, 365];

export function ExtendExpiryDialog({
  open,
  onOpenChange,
  customer,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: { user_id: string; email: string | null; expires_at: string } | null;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [exactDate, setExactDate] = useState("");

  if (!customer) return null;

  const apply = async (
    payload: { add_days?: number; expires_at?: string },
  ) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("admin-update-expiry", {
      body: { user_id: customer.user_id, ...payload },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message ?? "Failed");
      return;
    }
    toast.success("Expiry updated");
    onUpdated();
    onOpenChange(false);
    setExactDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit expiry</DialogTitle>
          <DialogDescription>
            {customer.email ?? "Customer"} · current expiry{" "}
            {new Date(customer.expires_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block text-sm">Quick extend</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => apply({ add_days: d })}
                >
                  +{d}d
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exact">Or set exact date</Label>
            <div className="flex gap-2">
              <Input
                id="exact"
                type="date"
                value={exactDate}
                onChange={(e) => setExactDate(e.target.value)}
              />
              <Button
                disabled={!exactDate || busy}
                onClick={() =>
                  apply({
                    expires_at: new Date(`${exactDate}T23:59:59`).toISOString(),
                  })
                }
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}