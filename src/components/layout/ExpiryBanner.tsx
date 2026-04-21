import { useEffect, useState } from "react";
import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { SUBSCRIPTION_RENEW_URL } from "@/lib/superAdminConfig";

const STORAGE_KEY = "ft_expiry_banner_dismissed_at";

export function ExpiryBanner() {
  const { isSuperAdmin } = useSuperAdmin();
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const ts = parseInt(dismissedAt, 10);
      // Re-show banner after 24h
      if (Date.now() - ts < 24 * 60 * 60 * 1000) setDismissed(true);
    }
  }, []);

  if (
    isSuperAdmin ||
    !sub.hasSubscription ||
    sub.isExpired ||
    sub.daysRemaining === null ||
    sub.daysRemaining > 7 ||
    dismissed
  ) {
    return null;
  }

  const days = sub.daysRemaining;
  return (
    <div className="border-b border-profit/40 bg-profit-soft px-4 py-2.5 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Your package expires in <strong>{days} {days === 1 ? "day" : "days"}</strong>. Renew to keep access.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="outline" className="h-8">
            <a
              href={SUBSCRIPTION_RENEW_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Renew Your Package
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, String(Date.now()));
              setDismissed(true);
            }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}