import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthly } from "@/data/mock";

export function IncomeExpenseChart() {
  return (
    <div className="ft-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Income vs Expense</h3>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-income" /> Income
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-expense" /> Expense
          </span>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer>
          <BarChart data={monthly} barGap={8} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--income))" stopOpacity={0.95} />
                <stop offset="100%" stopColor="hsl(var(--income))" stopOpacity={0.65} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--expense))" stopOpacity={0.95} />
                <stop offset="100%" stopColor="hsl(var(--expense))" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-card)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="income" fill="url(#incomeGrad)" radius={[8, 8, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="url(#expenseGrad)" radius={[8, 8, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}