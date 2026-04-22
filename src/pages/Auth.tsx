import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePublicStorefront } from "@/hooks/usePublicStorefront";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCustomer = params.get("customer") === "1";
  const explicitRedirect = params.get("redirect");
  const { settings } = usePublicStorefront();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);

  // After auth, decide where to send the user based on their role:
  // - super_admin or organization_member → /dashboard (admin app)
  // - ecom_customer (or no role) → /account (customer area on storefront)
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      if (explicitRedirect) {
        navigate(explicitRedirect, { replace: true });
        return;
      }
      setResolving(true);
      const [sa, mem] = await Promise.all([
        supabase.from("super_admins").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("organization_members").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;
      const isAdminLike = !!sa.data || !!mem.data;
      navigate(isAdminLike ? "/dashboard" : "/account", { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, explicitRedirect]);

  if (loading || resolving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (user) {
    // Effect above will redirect; render loader meanwhile.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — check your email to confirm.");
  };

  const storeName = settings?.store_name ?? "FinTrack Pro";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary-soft via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isCustomer ? storeName : "FinTrack Pro"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCustomer
              ? mode === "signin" ? "Sign in to your customer account." : "Create your customer account."
              : "Sign in to manage your business finances."}
          </p>
        </div>

        <div className="ft-card p-6">
          {isCustomer && (
            <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-lg py-2 font-semibold transition-colors ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg py-2 font-semibold transition-colors ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                Sign up
              </button>
            </div>
          )}

          <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-3">
            {isCustomer && mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          {!isCustomer ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <a
                href="https://businessdeskpro.brownfoxit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Renew Your Package
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">← Back to store</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}