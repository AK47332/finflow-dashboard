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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useIncomeStore } from "@/store/incomeStore";
import { useExpenseStore } from "@/store/expenseStore";
import { supabase } from "@/integrations/supabase/client";
import { currency as fmtCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "month" | "year" | "all";

function rangeStart(r: Range): Date | null {
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
  return null;
}

function ymKey(d: Date) {
  return `${d.toLocaleString(undefined, { month: "short" })}`;
}

function symbolFor(code?: string) {
  if (!code) return "$";
  try {
    return (
      new Intl.NumberFormat(undefined, { style: "currency", currency: code })
        .format(0)
        .replace(/[\d.,\s]/g, "") || code
    );
  } catch {
    return code;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { currentOrg, currentOrgId } = useOrg();
  const { incomes, fetch: fetchIncomes, loadedOrgId: incOrg } = useIncomeStore();
  const { expenses, fetch: fetchExpenses, loadedOrgId: expOrg } = useExpenseStore();
  const [range, setRange] = useState<Range>("month");
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [capital, setCapital] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

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

  const sym = symbolFor(currentOrg?.currency);
  const start = rangeStart(range);
  const filteredIncomes = useMemo(
    () => incomes.filter((i) => !start || new Date(i.date) >= start),
    [incomes, start],
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => !start || new Date(e.date) >= start),
    [expenses, start],
  );

  const totalIncome = filteredIncomes.reduce((s, x) => s + x.amount, 0);
  const totalExpense = filteredExpenses.reduce((s, x) => s + x.amount, 0);
  const profit = totalIncome - totalExpense;
  const capitalBalance = capital.reduce(
    (s, c: any) => s + (c.type === "contribution" ? Number(c.amount) : -Number(c.amount)),
    0,
  );
  const totalReceivable = receivables.reduce(
    (s, r: any) => s + (Number(r.amount) - Number(r.amount_paid ?? 0)),
    0,
  );
  const totalPayable = payables.reduce(
    (s, p: any) => s + (Number(p.amount) - Number(p.amount_paid ?? 0)),
    0,
  );

  // 6-month bar chart (always last 6 months regardless of range)
  const monthly = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: ymKey(d), income: 0, expense: 0 });
    }
    const find = (date: string) => {
      const d = new Date(date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return months.find((m) => m.key === k);
    };
    incomes.forEach((i) => {
      const m = find(i.date);
      if (m) m.income += i.amount;
    });
    expenses.forEach((e) => {
      const m = find(e.date);
      if (m) m.expense += e.amount;
    });
    return months;
  }, [incomes, expenses]);

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
            Welcome back, {greetingName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's how {currentOrg?.name ?? "your business"} is doing.
          </p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {allEmpty ? (
        <EmptyDashboard sym={sym} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Income" value={fmtCurrency(totalIncome, sym)} icon={TrendingUp} tone="income" />
            <StatCard label="Total Expense" value={fmtCurrency(totalExpense, sym)} icon={TrendingDown} tone="expense" />
            <StatCard
              label="Net Profit"
              value={fmtCurrency(profit, sym)}
              icon={PiggyBank}
              tone={profit >= 0 ? "profit" : "expense"}
            />
            <StatCard label="Capital" value={fmtCurrency(capitalBalance, sym)} icon={Wallet} tone="capital" />
            <StatCard label="Receivables" value={fmtCurrency(totalReceivable, sym)} icon={ArrowDownLeft} tone="receivable" />
            <StatCard label="Payables" value={fmtCurrency(totalPayable, sym)} icon={ArrowUpRight} tone="payable" />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="ft-card p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
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
                title="Expense by category"
                subtitle={range === "all" ? "All time" : `This ${range}`}
                data={expenseDonut}
                variant="expense"
              />
            ) : (
              <EmptyCard title="Expense by category" body="No expenses yet in this range." linkTo="/expense" linkText="Add expense" />
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <div className="ft-card p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Recent transactions</h3>
                    <p className="text-xs text-muted-foreground">Latest {recent.length} entries</p>
                  </div>
                  <Link to="/income" className="text-xs font-semibold text-primary hover:underline">
                    View all
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No transactions yet in this range.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recent.map((t) => {
                      const isIncome = t.kind === "income";
                      return (
                        <li key={t.id} className="flex items-center gap-3 py-3 sm:gap-4">
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
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            {incomeDonut.length > 0 ? (
              <CategoryDonut
                title="Income by source"
                subtitle={range === "all" ? "All time" : `This ${range}`}
                data={incomeDonut}
                variant="income"
              />
            ) : (
              <EmptyCard title="Income by source" body="No income yet in this range." linkTo="/income" linkText="Add income" />
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Top Clients */}
            <div className="ft-card p-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Top clients</h3>
                <p className="text-xs text-muted-foreground">By revenue ({range === "all" ? "all time" : `this ${range}`})</p>
              </div>
              {topClients.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No client revenue yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {topClients.map((c, i) => {
                    const max = topClients[0].value || 1;
                    return (
                      <li key={c.name}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-xs font-bold text-primary-foreground">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                              <span className="text-sm font-bold text-foreground">{fmtCurrency(c.value, sym)}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-primary"
                                style={{ width: `${(c.value / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
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
                  <h3 className="text-base font-semibold text-foreground">Upcoming reminders</h3>
                  <p className="text-xs text-muted-foreground">Next {reminders.length}</p>
                </div>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              {reminders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No reminders set.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/reminders">
                      <Plus className="h-3 w-3" /> Add reminder
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
                          {overdue ? "Overdue" : "Upcoming"}
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

function EmptyDashboard({ sym }: { sym: string }) {
  return (
    <div className="ft-card flex flex-col items-center justify-center gap-4 p-10 text-center sm:p-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
        <PiggyBank className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Let's get your books started</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Add your first income or expense to see live charts, profit & loss, and category insights here. Currency: <strong>{sym}</strong>
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
