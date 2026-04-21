import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingHero({ user }: { user: User | null }) {
  return (
    <section className="relative px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
          <Sparkles className="h-3 w-3 text-violet-300" />
          <span>Multi-workspace · Team-ready · Built for scale</span>
        </div>

        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl md:text-7xl">
          The finance OS
          <br />
          <span className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            for modern teams.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-white/60 sm:text-lg">
          Track every transaction, manage receivables and payables, run reports, and collaborate across workspaces — all in one beautifully fast app.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group h-12 rounded-xl bg-white px-6 text-base text-black shadow-2xl shadow-white/10 hover:bg-white/90">
            <Link to={user ? "/dashboard" : "/auth"}>
              {user ? "Open app" : "Start free — no card required"}
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12 rounded-xl px-6 text-base text-white/80 hover:bg-white/10 hover:text-white">
            <a href="#features">See features</a>
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-white/40">
          <span>✓ Unlimited transactions on Free</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">✓ Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
