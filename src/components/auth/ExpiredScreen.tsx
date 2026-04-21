import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ExternalLink, LogOut } from "lucide-react";
import { SUBSCRIPTION_RENEW_URL } from "@/lib/superAdminConfig";

export function ExpiredScreen() {
  const { user, signOut } = useAuth();
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-soft via-background to-muted/30 p-4">
      <section className="w-full max-w-md">
        <div className="ft-card p-7">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Clock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Your Package has been expired
            </h1>
            <p className="text-sm text-muted-foreground">
              Please contact with Brownfoxit.com support center to renew.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <a
                href={SUBSCRIPTION_RENEW_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Renew Your Package
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {user?.email && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Account: <span className="font-medium">{user.email}</span>
            </p>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Your data is safe and will be restored immediately after renewal.
          </p>
        </div>
      </section>
    </main>
  );
}