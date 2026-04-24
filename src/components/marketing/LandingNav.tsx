import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import logo from "@/assets/business-desk-pro-logo.png";

export function LandingNav({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[hsl(240_10%_4%/0.7)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <img src={logo} alt="Business Desk Pro" className="h-8 w-auto" />
          <span className="text-[15px]">Business Desk Pro</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="rounded-lg bg-white text-black hover:bg-white/90">
              <Link to="/dashboard">Open app</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-lg text-white/80 hover:bg-white/10 hover:text-white">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="rounded-lg bg-white text-black hover:bg-white/90">
                <Link to="/auth">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
