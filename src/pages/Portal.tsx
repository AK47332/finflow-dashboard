import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, ExternalLink } from "lucide-react";
import logo from "@/assets/business-desk-pro-logo.png";

const SUBSCRIPTION_URL = "https://businessdeskpro.brownfoxit.com";

export default function PortalPage() {
  useEffect(() => {
    document.title = "Business Desk Pro — Login or Get a subscription";
    const desc =
      "Login to your Business Desk Pro account or get a subscription to manage your business finances.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-black p-4">
      <section className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="Business Desk Pro" className="h-16 w-auto" />
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to Business Desk Pro
          </h1>
          <p className="text-sm text-white/70">
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