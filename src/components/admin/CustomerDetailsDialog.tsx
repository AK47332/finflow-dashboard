import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  Calendar,
  StickyNote,
  Clock,
} from "lucide-react";

export type CustomerDetails = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone?: string | null;
  organization_name?: string | null;
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

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/40 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value || <span className="text-muted-foreground">—</span>}
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: CustomerDetails | null;
}) {
  if (!customer) return null;
  const s = statusOf(customer.expires_at);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Admin details
            <Badge variant={s.variant}>{s.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Account, contact and subscription information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5">
          <Row icon={UserIcon} label="Full name" value={customer.full_name} />
          <Row icon={Mail} label="Email" value={customer.email} />
          <Row icon={Phone} label="Mobile number" value={customer.phone} />
          <Row
            icon={Building2}
            label="Workspace"
            value={customer.organization_name}
          />
          <Row
            icon={Calendar}
            label="Expires"
            value={
              <>
                {new Date(customer.expires_at).toLocaleString()}{" "}
                <span className="text-muted-foreground">
                  ({s.days <= 0 ? "expired" : `${s.days} day${s.days === 1 ? "" : "s"} left`})
                </span>
              </>
            }
          />
          <Row
            icon={Clock}
            label="Created"
            value={new Date(customer.created_at).toLocaleString()}
          />
          <Row icon={StickyNote} label="Notes" value={customer.notes} />
        </div>
      </DialogContent>
    </Dialog>
  );
}