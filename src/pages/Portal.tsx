import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogIn, ExternalLink } from "lucide-react";

const SUBSCRIPTION_URL = "https://businessdeskpro.brownfoxit.com";

export default function PortalPage() {
  useEffect(() => {
    document.title = "FinTrack Pro — Login or Get a subscription";
    const desc =
      "Login to your FinTrack Pro account or get a subscription to manage your business finances.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-soft via-background to-muted/30 p-4">
      <section className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome to FinTrack Pro
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your business finances with ease.
          </p>
        </div>

        <div className="ft-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="flex-1">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <a href={SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer">
                Renew Your Package
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Existing customers, please login. New customers can subscribe to get
            an account.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://brownfoxit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            BrownFoxIT
          </a>
        </p>
      </section>
    </main>
  );
}