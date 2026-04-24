import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Users,
  Shield,
  Zap,
} from "lucide-react";

const FEATURES = [
  { icon: TrendingUp, title: "Income tracking", body: "Log every sale, partial payment, and recurring stream with full attachments." },
  { icon: TrendingDown, title: "Expense management", body: "Capture vendor bills, recurring costs, and tax-ready receipts in seconds." },
  { icon: ArrowDownLeft, title: "Receivables ledger", body: "Know who owes you what — with overdue alerts and partial payments." },
  { icon: ArrowUpRight, title: "Payables ledger", body: "Stay ahead of every bill, with due-date reminders and one-click settlement." },
  { icon: Wallet, title: "Capital movements", body: "Track owner contributions and withdrawals separately from operating cash." },
  { icon: BarChart3, title: "Live reports", body: "Profit & loss, category breakdowns, and exports to CSV or PDF." },
  { icon: Users, title: "Team workspaces", body: "Invite teammates with role-based access. Each workspace stays fully isolated." },
  { icon: Shield, title: "Bank-grade security", body: "Row-level security at the database. Your data never touches another tenant." },
  { icon: Zap, title: "Built for speed", body: "Keyboard-first, instant search, and zero-jank interactions everywhere." },
];

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Everything you need</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One platform. Every money flow.
          </h2>
          <p className="mt-4 text-white/60">
            From the first invoice to the year-end report — Business Desk Pro replaces five separate tools with one cohesive system.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group relative bg-[hsl(240_10%_5%)] p-7 transition-colors hover:bg-[hsl(240_10%_7%)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <f.icon className="h-5 w-5 text-violet-300" />
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
