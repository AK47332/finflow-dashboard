import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For solo founders just getting started.",
    features: [
      "1 workspace",
      "Up to 2 team members",
      "Unlimited transactions",
      "Notes & reminders",
      "CSV export",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per workspace / month",
    desc: "For growing teams that need more control.",
    features: [
      "Unlimited team members",
      "1 workspace",
      "PDF reports & P&L",
      "Receivables & Payables",
      "Email reminders",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "per workspace / month",
    desc: "For agencies & multi-entity operators.",
    features: [
      "Everything in Pro",
      "Unlimited workspaces",
      "Advanced roles & audit log",
      "Custom categories",
      "API access (coming soon)",
      "Dedicated onboarding",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

export function LandingPricing({ user }: { user: User | null }) {
  return (
    <section id="pricing" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Pricing</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-4 text-white/60">
            Start free. Upgrade when your team grows. Cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-7 ${
                t.highlight
                  ? "border-violet-400/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-2xl shadow-violet-500/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-200 backdrop-blur">
                  Most popular
                </div>
              )}
              <div className="text-sm font-semibold tracking-tight text-white/80">{t.name}</div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <div className="text-4xl font-semibold tracking-tight">{t.price}</div>
                <div className="text-sm text-white/50">{t.period}</div>
              </div>
              <p className="mt-3 text-sm text-white/60">{t.desc}</p>

              <Button
                asChild
                className={`mt-6 w-full rounded-xl ${
                  t.highlight
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                <Link to={user ? "/dashboard" : "/auth"}>{t.cta}</Link>
              </Button>

              <ul className="mt-7 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
