import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "income" | "expense" | "profit" | "capital" | "receivable" | "payable";

const toneClasses: Record<Tone, { icon: string; gradient: string }> = {
  income: { icon: "bg-income-soft text-income", gradient: "bg-gradient-income" },
  expense: { icon: "bg-expense-soft text-expense", gradient: "bg-gradient-expense" },
  profit: { icon: "bg-profit-soft text-profit", gradient: "bg-gradient-profit" },
  capital: { icon: "bg-capital-soft text-capital", gradient: "bg-gradient-capital" },
  receivable: { icon: "bg-receivable-soft text-receivable", gradient: "bg-gradient-primary" },
  payable: { icon: "bg-payable-soft text-payable", gradient: "bg-gradient-expense" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  trend,
  trendDir = "up",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  const t = toneClasses[tone];
  const positive = trendDir === "up";
  return (
    <div className="ft-card ft-card-hover p-5">
      <div className="flex items-start justify-between">
        <div className={cn("ft-stat-icon", t.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
              positive ? "bg-income-soft text-income" : "bg-expense-soft text-expense",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-5">
        <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</div>
      </div>
    </div>
  );
}