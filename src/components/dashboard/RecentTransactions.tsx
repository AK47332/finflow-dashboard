import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { transactions } from "@/data/mock";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RecentTransactions() {
  return (
    <div className="ft-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent transactions</h3>
          <p className="text-xs text-muted-foreground">Last 10 entries</p>
        </div>
        <button className="text-xs font-semibold text-primary hover:underline">View all</button>
      </div>

      <ul className="divide-y divide-border/60">
        {transactions.slice(0, 8).map((t) => {
          const isIncome = t.kind === "income";
          return (
            <li key={t.id} className="flex items-center gap-4 py-3">
              <div
                className={cn(
                  "ft-stat-icon h-10 w-10 rounded-xl",
                  isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense",
                )}
              >
                {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{t.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {t.category} · {t.method}
                  {t.client ? ` · ${t.client}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-sm font-bold",
                    isIncome ? "text-income" : "text-expense",
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {currency(t.amount)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}