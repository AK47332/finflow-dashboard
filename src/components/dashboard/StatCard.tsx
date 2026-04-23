import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import patternWave from "@/assets/stat-pattern-wave.svg";
import patternDots from "@/assets/stat-pattern-dots.svg";
import patternBlob from "@/assets/stat-pattern-blob.svg";

type Tone = "income" | "expense" | "profit" | "capital" | "receivable" | "payable";

const toneStyles: Record<Tone, { gradient: string; pattern: string }> = {
  income:     { gradient: "bg-gradient-stat-income",     pattern: patternWave },
  expense:    { gradient: "bg-gradient-stat-expense",    pattern: patternBlob },
  profit:     { gradient: "bg-gradient-stat-profit",     pattern: patternDots },
  capital:    { gradient: "bg-gradient-stat-capital",    pattern: patternWave },
  receivable: { gradient: "bg-gradient-stat-receivable", pattern: patternBlob },
  payable:    { gradient: "bg-gradient-stat-payable",    pattern: patternDots },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  trend,
  trendDir = "up",
  to,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  trend?: string;
  trendDir?: "up" | "down";
  to?: string;
}) {
  const t = toneStyles[tone];
  const positive = trendDir === "up";
  const content = (
    <>
      <img
        src={t.pattern}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
      />
      <div className="relative flex items-start justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-white/80">
          {label}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {trend && (
          <div className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          "ft-stat-card block p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          t.gradient,
        )}
      >
        {content}
      </Link>
    );
  }
  return <div className={cn("ft-stat-card p-5", t.gradient)}>{content}</div>;
}