import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudShell } from "@/components/crud/CrudShell";
import { useIncomeStore } from "@/store/incomeStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useOrg } from "@/contexts/OrgContext";
import { currency } from "@/lib/format";
import {
  exportIncomesCSV,
  exportIncomesPDF,
  exportExpensesCSV,
  exportExpensesPDF,
} from "@/lib/export";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type RangeKey = "30d" | "90d" | "ytd" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "all", label: "All time" },
];

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--income))",
  "hsl(var(--expense))",
  "hsl(var(--capital))",
  "hsl(var(--profit))",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
];

function rangeStart(key: RangeKey): Date | null {
  const now = new Date();
  if (key === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (key === "90d") return new Date(now.getTime() - 90 * 86400000);
  if (key === "ytd") return new Date(now.getFullYear(), 0, 1);
  return null;
}

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const { currentOrgId, currentOrg } = useOrg();
  const { incomes, fetch: fetchIncomes, loadedOrgId: incOrg } = useIncomeStore();
  const { expenses, fetch: fetchExpenses, loadedOrgId: expOrg } = useExpenseStore();
  const [range, setRange] = useState<RangeKey>("30d");
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
    return () => {
      cancel = true;
    };
  }, [currentOrgId, incOrg, expOrg, fetchIncomes, fetchExpenses]);

  const start = rangeStart(range);

  const fIncomes = useMemo(
    () => incomes.filter((i) => !start || new Date(i.date) >= start),
    [incomes, start],
  );
  const fExpenses = useMemo(
    () => expenses.filter((e) => !start || new Date(e.date) >= start),
    [expenses, start],
  );

  const totalIncome = fIncomes.reduce((s, x) => s + x.amount, 0);
  const totalExpense = fExpenses.reduce((s, x) => s + x.amount, 0);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome ? (profit / totalIncome) * 100 : 0;

  // Monthly bars
  const monthly = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    const ensure = (k: string) => {
      if (!map[k]) map[k] = { month: k, income: 0, expense: 0 };
      return map[k];
    };
    fIncomes.forEach((i) => (ensure(ymKey(new Date(i.date))).income += i.amount));
    fExpenses.forEach((e) => (ensure(ymKey(new Date(e.date))).expense += e.amount));
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [fIncomes, fExpenses]);

  // Category donuts
  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    fIncomes.forEach((i) => (map[i.category] = (map[i.category] ?? 0) + i.amount));
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [fIncomes]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    fExpenses.forEach((e) => (map[e.category] = (map[e.category] ?? 0) + e.amount));
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [fExpenses]);

  // Top clients
  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    fIncomes.forEach((i) => {
      if (!i.client) return;
      map[i.client] = (map[i.client] ?? 0) + i.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [fIncomes]);

  const symbol = currentOrg?.currency
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: currentOrg.currency })
        .format(0)
        .replace(/[\d.,\s]/g, "") || currentOrg.currency
    : "$";

  const exportPL = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(currentOrg?.name ?? "Profit & Loss", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    const label = RANGES.find((r) => r.key === range)?.label ?? "";
    doc.text(`${label} · Generated ${new Date().toLocaleDateString()}`, 14, 24);

    autoTable(doc, {
      startY: 32,
      head: [["Summary", "Amount"]],
      body: [
        ["Total Income", currency(totalIncome, symbol)],
        ["Total Expenses", currency(totalExpense, symbol)],
        ["Net Profit / Loss", currency(profit, symbol)],
        ["Profit Margin", `${margin.toFixed(1)}%`],
      ],
      headStyles: { fillColor: [37, 99, 235] },
    });

    if (incomeByCategory.length) {
      autoTable(doc, {
        head: [["Income by Category", "Amount"]],
        body: incomeByCategory.map((r) => [r.name, currency(r.value, symbol)]),
        headStyles: { fillColor: [16, 185, 129] },
      });
    }
    if (expenseByCategory.length) {
      autoTable(doc, {
        head: [["Expense by Category", "Amount"]],
        body: expenseByCategory.map((r) => [r.name, currency(r.value, symbol)]),
        headStyles: { fillColor: [244, 63, 94] },
      });
    }
    if (topClients.length) {
      autoTable(doc, {
        head: [["Top Clients", "Revenue"]],
        body: topClients.map((r) => [r.name, currency(r.value, symbol)]),
        headStyles: { fillColor: [124, 58, 237] },
      });
    }

    doc.save(`profit-loss-${range}.pdf`);
  };

  return (
    <CrudShell
      title="Reports"
      description="Profit & loss, category breakdowns and exports."
      loading={loading}
      onAdd={exportPL}
      addLabel="Download P&L"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-income/10 text-income">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Income</p>
                <p className="text-2xl font-bold text-foreground">{currency(totalIncome, symbol)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-expense/10 text-expense">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-foreground">{currency(totalExpense, symbol)}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-profit/10 text-profit">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? "text-profit" : "text-expense"}`}>
                  {currency(profit, symbol)}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.key} value={r.key}>
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportIncomesCSV(fIncomes)}>
              <Download className="h-4 w-4" /> Income CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportIncomesPDF(fIncomes)}>
              <FileText className="h-4 w-4" /> Income PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExpensesCSV(fExpenses)}>
              <Download className="h-4 w-4" /> Expense CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExpensesPDF(fExpenses)}>
              <FileText className="h-4 w-4" /> Expense PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ft-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Income vs Expense</h3>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
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
                  formatter={(v: number) => currency(v, symbol)}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Income by Category</h3>
          {incomeByCategory.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No income data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={incomeByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                  {incomeByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => currency(v, symbol)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Expense by Category</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No expense data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => currency(v, symbol)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ft-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Top Clients</h3>
          {topClients.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              No client revenue yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {topClients.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-income">{currency(c.value, symbol)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CrudShell>
  );
}
