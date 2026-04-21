import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TopClients } from "@/components/dashboard/TopClients";
import { UpcomingReminders } from "@/components/dashboard/UpcomingReminders";
import { DateFilterTabs } from "@/components/dashboard/DateFilterTabs";
import { expenseByCategory, incomeBySource } from "@/data/mock";

export default function Dashboard() {
  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, Alex 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's how your business is doing this month.
          </p>
        </div>
        <DateFilterTabs />
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Income" value="$13,540" icon={TrendingUp} tone="income" trend="12.4%" trendDir="up" />
        <StatCard label="Total Expense" value="$7,820" icon={TrendingDown} tone="expense" trend="3.2%" trendDir="down" />
        <StatCard label="Net Profit" value="$5,720" icon={PiggyBank} tone="profit" trend="18.6%" trendDir="up" />
        <StatCard label="Current Capital" value="$42,310" icon={Wallet} tone="capital" trend="2.1%" trendDir="up" />
        <StatCard label="Receivables" value="$6,140" icon={ArrowDownLeft} tone="receivable" />
        <StatCard label="Payables" value="$2,980" icon={ArrowUpRight} tone="payable" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IncomeExpenseChart />
        </div>
        <CategoryDonut
          title="Expense by category"
          subtitle="This month"
          data={expenseByCategory}
          variant="expense"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <CategoryDonut
          title="Income by source"
          subtitle="This month"
          data={incomeBySource}
          variant="income"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopClients />
        <UpcomingReminders />
      </section>
    </div>
  );
}