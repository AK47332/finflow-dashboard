import { useEffect, useMemo, useState } from "react";
import { Loader2, Sprout, TrendingDown, TrendingUp, Download, CalendarRange } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useOrg } from "@/contexts/OrgContext";
import { useIncomeStore } from "@/store/incomeStore";
import { useExpenseStore } from "@/store/expenseStore";
import { currency } from "@/lib/format";
import { CrudShell } from "@/components/crud/CrudShell";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type RangeKey = "month" | "ytd" | "year" | "all" | "custom";

function startOf(r: RangeKey, customFrom?: string): Date | null {
  const now = new Date();
  if (r === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (r === "ytd") return new Date(now.getFullYear(), 0, 1);
  if (r === "year") return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  if (r === "custom") return customFrom ? new Date(customFrom) : null;
  return null;
}
function endOf(r: RangeKey, customTo?: string): Date | null {
  if (r === "custom" && customTo) {
    const d = new Date(customTo);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return null;
}

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ProfitLossPage() {
  const { currentOrgId, currentOrg } = useOrg();
  const { incomes, fetch: fetchIncomes, loadedOrgId: incOrg } = useIncomeStore();
  const { expenses, fetch: fetchExpenses, loadedOrgId: expOrg } = useExpenseStore();

  const [range, setRange] = useState<RangeKey>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentOrgId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const tasks: Promise<void>[] = [];
        if (incOrg !== currentOrgId) tasks.push(fetchIncomes(currentOrgId));
        if (expOrg !== currentOrgId) tasks.push(fetchExpenses(currentOrgId));
        await Promise.all(tasks);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [currentOrgId, incOrg, expOrg, fetchIncomes, fetchExpenses]);

  const start = startOf(range, customFrom);
  const end = endOf(range, customTo);

  const fIncomes = useMemo(
    () => incomes.filter((i) => {
      const d = new Date(i.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }),
    [incomes, start, end],
  );
  const fExpenses = useMemo(
    () => expenses.filter((e) => {
      const d = new Date(e.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }),
    [expenses, start, end],
  );

  const totalIncome = fIncomes.reduce((s, x) => s + x.amount, 0);
  const totalExpense = fExpenses.reduce((s, x) => s + x.amount, 0);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome ? (profit / totalIncome) * 100 : 0;

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number; net: number }> = {};
    const ensure = (k: string) => {
      if (!map[k]) map[k] = { month: k, income: 0, expense: 0, net: 0 };
      return map[k];
    };
    fIncomes.forEach((i) => (ensure(ymKey(new Date(i.date))).income += i.amount));
    fExpenses.forEach((e) => (ensure(ymKey(new Date(e.date))).expense += e.amount));
    Object.values(map).forEach((m) => (m.net = m.income - m.expense));
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [fIncomes, fExpenses]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    fIncomes.forEach((i) => (map[i.category] = (map[i.category] ?? 0) + i.amount));
    return Object.entries(map).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value);
  }, [fIncomes]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    fExpenses.forEach((e) => (map[e.category] = (map[e.category] ?? 0) + e.amount));
    return Object.entries(map).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value);
  }, [fExpenses]);

  const exportPL = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${currentOrg?.name ?? "Workspace"} — Profit & Loss`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    const label =
      range === "custom"
        ? `${customFrom || "—"} → ${customTo || "—"}`
        : range.toUpperCase();
    doc.text(`${label} · Generated ${new Date().toLocaleDateString()}`, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Summary", "Amount"]],
      body: [
        ["Total Income", currency(totalIncome)],
        ["Total Expenses", currency(totalExpense)],
        ["Net Profit / Loss", currency(profit)],
        ["Profit Margin", `${margin.toFixed(1)}%`],
      ],
      headStyles: { fillColor: [37, 99, 235] },
    });
    if (incomeByCategory.length) {
      autoTable(doc, {
        head: [["Income by Category", "Amount"]],
        body: incomeByCategory.map((r) => [r.name, currency(r.value)]),
        headStyles: { fillColor: [16, 185, 129] },
      });
    }
    if (expenseByCategory.length) {
      autoTable(doc, {
        head: [["Expense by Category", "Amount"]],
        body: expenseByCategory.map((r) => [r.name, currency(r.value)]),
        headStyles: { fillColor: [244, 63, 94] },
      });
    }
    doc.save(`profit-loss-${range}.pdf`);
  };

  if (loading && incomes.length === 0 && expenses.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CrudShell
      title="Profit & Loss"
      description="Live profit and loss across any period."
      onAdd={exportPL}
      addLabel="Download PDF"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-income/10 text-income"><TrendingUp className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-foreground">{currency(totalIncome)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-expense/10 text-expense"><TrendingDown className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-foreground">{currency(totalExpense)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-profit/10 text-profit"><Sprout className="h-5 w-5" /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? "text-profit" : "text-expense"}`}>
                  {currency(profit)}
                </p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Profit Margin</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{margin.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              {fIncomes.length + fExpenses.length} entries
            </p>
          </div>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="month">This month</TabsTrigger>
              <TabsTrigger value="ytd">Year to date</TabsTrigger>
              <TabsTrigger value="year">Last 12 months</TabsTrigger>
              <TabsTrigger value="all">All time</TabsTrigger>
              <TabsTrigger value="custom" onClick={() => setCustomOpen(true)}>Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          {range === "custom" && (
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarRange className="h-4 w-4" />
                  {customFrom && customTo ? `${customFrom} → ${customTo}` : "Pick range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pfrom" className="text-xs">From</Label>
                  <Input id="pfrom" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pto" className="text-xs">To</Label>
                  <Input id="pto" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
                <Button size="sm" className="w-full" onClick={() => setCustomOpen(false)}>Apply</Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Income vs Expense</h3>
          {monthly.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No data in this range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => currency(v)}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Monthly Net Profit</h3>
          {monthly.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Nothing to chart yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number) => currency(v)}
                />
                <Bar dataKey="net" fill="hsl(var(--profit))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Income by Category</h3>
          {incomeByCategory.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No income in this range.</p>
          ) : (
            <ul className="divide-y divide-border">
              {incomeByCategory.map((r) => (
                <li key={r.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">{r.name}</span>
                  <span className="font-semibold text-income">{currency(r.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Expense by Category</h3>
          {expenseByCategory.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No expenses in this range.</p>
          ) : (
            <ul className="divide-y divide-border">
              {expenseByCategory.map((r) => (
                <li key={r.name} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">{r.name}</span>
                  <span className="font-semibold text-expense">{currency(r.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="ft-card mt-4 flex items-center justify-end gap-2 p-4">
        <Button onClick={exportPL} variant="outline" size="sm">
          <Download className="h-4 w-4" /> Download P&amp;L PDF
        </Button>
      </div>
    </CrudShell>
  );
}