import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function LandingShowcase() {
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[hsl(240_10%_8%)] to-[hsl(240_10%_4%)] p-2 shadow-2xl shadow-violet-500/10">
          <div className="rounded-2xl border border-white/5 bg-[hsl(240_10%_3%)] p-6 sm:p-10">
            {/* Mock dashboard */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/40">Dashboard</div>
                <div className="mt-1 text-lg font-semibold">This month</div>
              </div>
              <div className="hidden gap-2 sm:flex">
                <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Today</span>
                <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Week</span>
                <span className="rounded-md border border-white/20 bg-white px-3 py-1 text-xs font-medium text-black">Month</span>
                <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">Year</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Income", value: "$84,250", icon: TrendingUp, accent: "from-emerald-500/20 to-transparent", iconColor: "text-emerald-300" },
                { label: "Total Expense", value: "$32,180", icon: TrendingDown, accent: "from-rose-500/20 to-transparent", iconColor: "text-rose-300" },
                { label: "Receivables", value: "$12,400", icon: ArrowDownLeft, accent: "from-violet-500/20 to-transparent", iconColor: "text-violet-300" },
                { label: "Payables", value: "$5,820", icon: ArrowUpRight, accent: "from-amber-500/20 to-transparent", iconColor: "text-amber-300" },
              ].map((s) => (
                <div key={s.label} className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${s.accent} p-5`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-white/60">{s.label}</div>
                    <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-white/80">Income vs Expense</div>
                  <div className="text-xs text-white/40">Last 6 months</div>
                </div>
                <div className="flex h-40 items-end gap-3">
                  {[40, 65, 45, 80, 60, 92].map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400" style={{ height: `${h}%` }} />
                      <div className="w-full rounded-t bg-white/10" style={{ height: `${h * 0.5}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="mb-4 text-sm font-medium text-white/80">Top categories</div>
                <div className="space-y-3 text-sm">
                  {[
                    { name: "Sales", val: 45, color: "bg-violet-400" },
                    { name: "Services", val: 30, color: "bg-emerald-400" },
                    { name: "Subscriptions", val: 15, color: "bg-amber-400" },
                    { name: "Other", val: 10, color: "bg-white/30" },
                  ].map((c) => (
                    <div key={c.name}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-white/70">{c.name}</span>
                        <span className="text-white/40">{c.val}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full ${c.color}`} style={{ width: `${c.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
