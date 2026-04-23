import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Loader2,
  Plus,
  StickyNote,
  ArrowRight,
  Banknote,
  Landmark,
  Smartphone,
  CreditCard,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useIncomeStore } from "@/store/incomeStore";
import { useExpenseStore } from "@/store/expenseStore";
import { supabase } from "@/integrations/supabase/client";
import { currency as fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

type Range = "today" | "week" | "month" | "year" | "all" | "custom";

function rangeStart(r: Range, customStart?: string | null): Date | null {
  const now = new Date();
  if (r === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (r === "week") {
    const d = new Date(now);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (r === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (r === "year") return new Date(now.getFullYear(), 0, 1);
  if (r === "custom") return customStart ? new Date(customStart) : null;
  return null;
}

function rangeEnd(r: Range, customEnd?: string | null): Date | null {
  if (r === "custom" && customEnd) {
    const d = new Date(customEnd);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null;
}

function ymKey(d: Date) {
  return `${d.toLocaleString(undefined, { month: "short" })}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { currentOrg, currentOrgId } = useOrg();
  const { t } = useLocale();
  const { incomes, fetch: fetchIncomes, loadedOrgId: incOrg } = useIncomeStore();
  const { expenses, fetch: fetchExpenses, loadedOrgId: expOrg } = useExpenseStore();
  const [range, setRange] = useState<Range>("month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [customOpen, setCustomOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [capital, setCapital] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  // Live clock for the dashboard header
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!currentOrgId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const tasks: Promise<any>[] = [];
        if (incOrg !== currentOrgId) tasks.push(fetchIncomes(currentOrgId));
        if (expOrg !== currentOrgId) tasks.push(fetchExpenses(currentOrgId));
        await Promise.all(tasks);

        const [{ data: rec }, { data: pay }, { data: cap }, { data: rem }] =
          await Promise.all([
            (supabase as any)
              .from("receivables")
              .select("*")
              .eq("organization_id", currentOrgId),
            (supabase as any)
              .from("payables")
              .select("*")
              .eq("organization_id", currentOrgId),
            (supabase as any)
              .from("capital_movements")
              .select("*")
              .eq("organization_id", currentOrgId),
            (supabase as any)
              .from("reminders")
              .select("*")
              .eq("organization_id", currentOrgId)
              .eq("completed", false)
              .order("due_at", { ascending: true })
              .limit(5),
          ]);
        if (cancel) return;
        setReceivables(rec ?? []);
        setPayables(pay ?? []);
        setCapital(cap ?? []);
        setReminders(rem ?? []);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [currentOrgId, incOrg, expOrg, fetchIncomes, fetchExpenses]);

  // Currency symbol now flows from OrgContext into the global formatter,
  // so calling currency(n) without args automatically uses the right symbol.
  const sym = undefined as unknown as string | undefined;
  const start = rangeStart(range, customFrom);
  const end = rangeEnd(range, customTo);
  const filteredIncomes = useMemo(
    () =>
      incomes.filter((i) => {
        const d = new Date(i.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      }),
    [incomes, start, end],
  );
  const filteredExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      }),
    [expenses, start, end],
  );

  const totalIncome = filteredIncomes.reduce((s, x) => s + x.amount, 0);
  const totalExpense = filteredExpenses.reduce((s, x) => s + x.amount, 0);
  const profit = totalIncome - totalExpense;
  const capitalBalance = capital.reduce(
    (s, c: any) => s + (c.type === "contribution" ? Number(c.amount) : -Number(c.amount)),
    0,
  );

  // Per-payment-method capital balance (contributions add, withdrawals subtract)
  const CAPITAL_METHODS = ["Cash", "Bank Transfer", "Mobile Banking", "Card", "Other"] as const;
  const capitalByMethod = useMemo(() => {
    const map = new Map<string, number>();
    CAPITAL_METHODS.forEach((m) => map.set(m, 0));
    capital.forEach((c: any) => {
      const raw = (c.payment_method as string | null) ?? "Other";
      const key = (CAPITAL_METHODS as readonly string[]).includes(raw) ? raw : "Other";
      const sign = c.type === "contribution" ? 1 : -1;
      map.set(key, (map.get(key) ?? 0) + sign * Number(c.amount));
    });
    return CAPITAL_METHODS.map((m) => ({ method: m, balance: map.get(m) ?? 0 }));
  }, [capital]);

  const methodIcon = (m: string) => {
    switch (m) {
      case "Cash": return Banknote;
      case "Bank Transfer": return Landmark;
      case "Mobile Banking": return Smartphone;
      case "Card": return CreditCard;
      default: return MoreHorizontal;
    }
  };

  const totalReceivable = receivables.reduce(
    (s, r: any) => s + (Number(r.amount) - Number(r.amount_paid ?? 0)),
    0,
  );
  const totalPayable = payables.reduce(
    (s, p: any) => s + (Number(p.amount) - Number(p.amount_paid ?? 0)),
    0,
  );

  // Range-aware bar chart series.
  // - today: hourly buckets (4-hour windows) for the day
  // - week: 7 daily buckets
  // - month: 30 daily buckets
  // - year: 12 monthly buckets
  // - all / custom: auto — daily if span <= 60 days, else monthly
  const { series: monthly, chartSubtitle } = useMemo(() => {
    type Bucket = { key: string; label: string; income: number; expense: number; from: Date; to: Date };
    const now = new Date();
    const buckets: Bucket[] = [];

    const pushDaily = (count: number) => {
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const to = new Date(d);
        to.setHours(23, 59, 59, 999);
        buckets.push({
          key: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          income: 0,
          expense: 0,
          from: d,
          to,
        });
      }
    };
    const pushMonthly = (count: number) => {
      for (let i = count - 1; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
        buckets.push({
          key: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`,
          label: from.toLocaleString(undefined, { month: "short" }),
          income: 0,
          expense: 0,
          from,
          to,
        });
      }
    };

    let subtitle = "";
    if (range === "today") {
      // 6 four-hour windows so the chart still has visible bars
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 6; i++) {
        const from = new Date(start);
        from.setHours(i * 4);
        const to = new Date(start);
        to.setHours(i * 4 + 3, 59, 59, 999);
        buckets.push({
          key: `h${i}`,
          label: `${String(i * 4).padStart(2, "0")}:00`,
          income: 0,
          expense: 0,
          from,
          to,
        });
      }
      subtitle = t("range.today");
    } else if (range === "week") {
      pushDaily(7);
      subtitle = t("range.week");
    } else if (range === "month") {
      pushDaily(30);
      subtitle = t("range.month");
    } else if (range === "year") {
      pushMonthly(12);
      subtitle = t("range.year");
    } else if (range === "custom" && start && end) {
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      if (days <= 60) {
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          d.setHours(0, 0, 0, 0);
          const to = new Date(d);
          to.setHours(23, 59, 59, 999);
          buckets.push({
            key: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            income: 0,
            expense: 0,
            from: d,
            to,
          });
        }
      } else {
        // monthly buckets across custom range
        const cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const last = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cur <= last) {
          const from = new Date(cur);
          const to = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
          buckets.push({
            key: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`,
            label: from.toLocaleString(undefined, { month: "short" }),
            income: 0,
            expense: 0,
            from,
            to,
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }
      subtitle = `${customFrom || ""} → ${customTo || ""}`;
    } else {
      // all
      pushMonthly(12);
      subtitle = t("card.allTime");
    }

    const place = (dateStr: string, amount: number, kind: "income" | "expense") => {
      const d = new Date(dateStr);
      const b = buckets.find((x) => d >= x.from && d <= x.to);
      if (b) b[kind] += amount;
    };
    incomes.forEach((i) => place(i.date, i.amount, "income"));
    expenses.forEach((e) => place(e.date, e.amount, "expense"));

    return { series: buckets, chartSubtitle: subtitle };
  }, [incomes, expenses, range, start, end, customFrom, customTo, t]);

  const expenseDonut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => (map[e.category] = (map[e.category] ?? 0) + e.amount));
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredExpenses]);

  const incomeDonut = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => (map[i.category] = (map[i.category] ?? 0) + i.amount));
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredIncomes]);

  const recent = useMemo(() => {
    const inc = filteredIncomes.map((i) => ({
      kind: "income" as const,
      id: `i-${i.id}`,
      rawId: i.id,
      title: i.title,
      category: i.category,
      method: i.paymentMethod,
      client: i.client,
      amount: i.amount,
      date: i.date,
    }));
    const exp = filteredExpenses.map((e) => ({
      kind: "expense" as const,
      id: `e-${e.id}`,
      rawId: e.id,
      title: e.title,
      category: e.category,
      method: e.paymentMethod,
      client: e.vendor,
      amount: e.amount,
      date: e.date,
    }));
    return [...inc, ...exp]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);
  }, [filteredIncomes, filteredExpenses]);

  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncomes.forEach((i) => {
      if (!i.client) return;
      map[i.client] = (map[i.client] ?? 0) + i.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredIncomes]);

  const greetingName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  if (loading && incomes.length === 0 && expenses.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const allEmpty =
    incomes.length === 0 &&
    expenses.length === 0 &&
    receivables.length === 0 &&
    payables.length === 0 &&
    capital.length === 0;

  return (
    <div className="relative animate-fade-in space-y-6">
      {/* Decorative background flourish */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-profit/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-capital/10 blur-3xl" />
      </div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("dash.welcome")}, {greetingName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dash.subtitle", { org: currentOrg?.name ?? t("dash.yourBusiness") })}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="tabular-nums">
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="today">{t("range.today")}</TabsTrigger>
            <TabsTrigger value="week">{t("range.week")}</TabsTrigger>
            <TabsTrigger value="month">{t("range.month")}</TabsTrigger>
            <TabsTrigger value="year">{t("range.year")}</TabsTrigger>
            <TabsTrigger value="all">{t("range.all")}</TabsTrigger>
            <TabsTrigger
              value="custom"
              onClick={() => setCustomOpen(true)}
            >
              {t("range.custom")}
            </TabsTrigger>
          </TabsList>
          </Tabs>
        </div>
      </header>

      {range === "custom" && (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              {customFrom && customTo
                ? `${customFrom} → ${customTo}`
                : t("range.pick")}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dfrom" className="text-xs">{t("range.from")}</Label>
              <Input
                id="dfrom"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dto" className="text-xs">{t("range.to")}</Label>
              <Input
                id="dto"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => setCustomOpen(false)}
            >
              {t("range.apply")}
            </Button>
          </PopoverContent>
        </Popover>
      )}

      {allEmpty ? (
        <EmptyDashboard sym={sym} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label={t("stat.totalIncome")} value={fmtCurrency(totalIncome, sym)} icon={TrendingUp} tone="income" />
            <StatCard label={t("stat.totalExpense")} value={fmtCurrency(totalExpense, sym)} icon={TrendingDown} tone="expense" />
            <StatCard
              label={t("stat.netProfit")}
              value={fmtCurrency(profit, sym)}
              icon={PiggyBank}
              tone={profit >= 0 ? "profit" : "expense"}
            />
            <StatCard label={t("stat.capital")} value={fmtCurrency(capitalBalance, sym)} icon={Wallet} tone="capital" />
            <StatCard label={t("stat.receivables")} value={fmtCurrency(totalReceivable, sym)} icon={ArrowDownLeft} tone="receivable" />
            <StatCard label={t("stat.payables")} value={fmtCurrency(totalPayable, sym)} icon={ArrowUpRight} tone="payable" />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="ft-card p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t("card.incomeVsExpense")}</h3>
                    <p className="text-xs text-muted-foreground">{chartSubtitle}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm bg-income" /> {t("card.income")}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm bg-expense" /> {t("card.expense")}
                    </span>
                  </div>
                </div>
                <div className="h-[240px] w-full sm:h-[260px]">
                  <ResponsiveContainer>
                    <BarChart data={monthly} barGap={6} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.75rem",
                          boxShadow: "var(--shadow-card)",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => fmtCurrency(v, sym)}
                      />
                      <Bar dataKey="income" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {expenseDonut.length > 0 ? (
              <CategoryDonut
                title={t("card.expenseByCategory")}
                subtitle={
                  range === "all"
                    ? t("card.allTime")
                    : range === "custom"
                    ? t("range.custom")
                    : t(`card.this${range.charAt(0).toUpperCase() + range.slice(1)}` as any)
                }
                data={expenseDonut}
                variant="expense"
              />
            ) : (
              <EmptyCard title={t("card.expenseByCategory")} body={t("card.noExpenseRange")} linkTo="/expense" linkText={t("card.addExpense")} />
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="ft-card p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t("card.recentTransactions")}</h3>
                    <p className="text-xs text-muted-foreground">{t("card.latestEntries", { n: recent.length })}</p>
                  </div>
                  <Link to="/income" className="text-xs font-semibold text-primary hover:underline">
                    {t("card.viewAll")}
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("card.noTxRange")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recent.map((t) => {
                      const isIncome = t.kind === "income";
                      const href = isIncome
                        ? `/income?focus=${t.rawId}`
                        : `/expense?focus=${t.rawId}`;
                      return (
                        <li key={t.id}>
                          <Link
                            to={href}
                            className="flex items-center gap-3 py-3 sm:gap-4 -mx-2 px-2 rounded-lg transition-colors hover:bg-muted/40"
                            aria-label={`Open ${isIncome ? "income" : "expense"}: ${t.title}`}
                          >
                          <div
                            className={cn(
                              "ft-stat-icon h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10",
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
                            <div className={cn("text-sm font-bold", isIncome ? "text-income" : "text-expense")}>
                              {isIncome ? "+" : "−"}
                              {fmtCurrency(t.amount, sym)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {new Date(t.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            {incomeDonut.length > 0 ? (
              <CategoryDonut
                title={t("card.incomeBySource")}
                subtitle={
                  range === "all"
                    ? t("card.allTime")
                    : range === "custom"
                    ? t("range.custom")
                    : t(`card.this${range.charAt(0).toUpperCase() + range.slice(1)}` as any)
                }
                data={incomeDonut}
                variant="income"
              />
            ) : (
              <EmptyCard title={t("card.incomeBySource")} body={t("card.noIncomeRange")} linkTo="/income" linkText={t("card.addIncome")} />
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Top Clients */}
            <div className="ft-card p-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">{t("card.topClients")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("card.byRevenue", {
                    range:
                      range === "all"
                        ? t("card.allTime")
                        : range === "custom"
                        ? t("range.custom")
                        : t(`card.this${range.charAt(0).toUpperCase() + range.slice(1)}` as any),
                  })}
                </p>
              </div>
              {topClients.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("card.noClientRevenue")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {topClients.map((c, i) => {
                    const max = topClients[0].value || 1;
                    return (
                      <li key={c.name}>
                        <Link
                          to={`/clients?focus=${encodeURIComponent(c.name)}`}
                          className="flex items-center gap-3 rounded-lg p-1 -m-1 transition-colors hover:bg-muted/50"
                          aria-label={`Open client ${c.name}`}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-xs font-bold text-primary-foreground">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-semibold text-foreground hover:text-primary">{c.name}</span>
                              <span className="text-sm font-bold text-foreground">{fmtCurrency(c.value, sym)}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-primary"
                                style={{ width: `${(c.value / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Upcoming reminders */}
            <div className="ft-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{t("card.upcomingReminders")}</h3>
                  <p className="text-xs text-muted-foreground">{t("card.next", { n: reminders.length })}</p>
                </div>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              {reminders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("card.noReminders")}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/reminders">
                      <Plus className="h-3 w-3" /> {t("card.addReminder")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {reminders.map((r: any) => {
                    const due = new Date(r.due_at).getTime();
                    const overdue = due < Date.now();
                    return (
                      <li
                        key={r.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border-l-4 p-3",
                          overdue
                            ? "border-l-expense bg-expense-soft/40"
                            : "border-l-primary bg-primary-soft/40",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground">{r.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(r.due_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            overdue
                              ? "bg-expense-soft text-expense"
                              : "bg-primary-soft text-primary",
                          )}
                        >
                          {overdue ? t("badge.overdue") : t("badge.upcoming")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyCard({
  title,
  body,
  linkTo,
  linkText,
}: {
  title: string;
  body: string;
  linkTo: string;
  linkText: string;
}) {
  return (
    <div className="ft-card flex flex-col items-center justify-center gap-3 p-8 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground">{body}</p>
      <Button asChild size="sm" variant="outline">
        <Link to={linkTo}>
          <Plus className="h-3 w-3" /> {linkText}
        </Link>
      </Button>
    </div>
  );
}

function EmptyDashboard({ sym }: { sym?: string }) {
  return (
    <div className="ft-card flex flex-col items-center justify-center gap-4 p-10 text-center sm:p-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
        <PiggyBank className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Let's get your books started</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Add your first income or expense to see live charts, profit & loss, and category insights here. Currency: <strong>{sym ?? ""}</strong>
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="bg-income text-income-foreground hover:bg-income/90">
          <Link to="/income">
            <TrendingUp className="h-4 w-4" /> Add income
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/expense">
            <TrendingDown className="h-4 w-4" /> Add expense
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/clients">
            <ArrowRight className="h-4 w-4" /> Add client
          </Link>
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
        {[
          { icon: TrendingUp, label: "Track every sale" },
          { icon: TrendingDown, label: "Categorize spending" },
          { icon: PiggyBank, label: "See profit live" },
          { icon: StickyNote, label: "Notes & reminders" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5">
            <f.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
