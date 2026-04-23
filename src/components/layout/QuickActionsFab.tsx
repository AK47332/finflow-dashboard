import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, StickyNote, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IncomeFormDialog } from "@/components/income/IncomeFormDialog";
import { ExpenseFormDialog } from "@/components/expense/ExpenseFormDialog";
import { useIncomeStore } from "@/store/incomeStore";
import { useExpenseStore } from "@/store/expenseStore";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function QuickActionsFab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrgId } = useOrg();
  const { add: addIncome } = useIncomeStore();
  const { add: addExpense } = useExpenseStore();

  const [open, setOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const guard = () => {
    if (!user || !currentOrgId) {
      toast.error("Workspace is still loading. Try again in a moment.");
      return false;
    }
    return true;
  };

  const actions = [
    {
      label: "Add Income",
      icon: TrendingUp,
      classes: "bg-income text-income-foreground",
      onClick: () => {
        if (!guard()) return;
        setOpen(false);
        setIncomeOpen(true);
      },
    },
    {
      label: "Add Expense",
      icon: TrendingDown,
      classes: "bg-expense text-expense-foreground",
      onClick: () => {
        if (!guard()) return;
        setOpen(false);
        setExpenseOpen(true);
      },
    },
    {
      label: "Add Note",
      icon: StickyNote,
      classes: "bg-profit text-profit-foreground",
      onClick: () => {
        setOpen(false);
        navigate("/notes");
      },
    },
    {
      label: "Add Reminder",
      icon: Bell,
      classes: "bg-capital text-capital-foreground",
      onClick: () => {
        setOpen(false);
        navigate("/reminders");
      },
    },
  ];

  return (
    <>
      <div className="pointer-events-none fixed bottom-6 left-4 z-40 flex flex-col items-start gap-3 sm:left-auto sm:right-6 sm:items-end">
        {actions.map((a, i) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lift transition-all duration-300",
              a.classes,
              open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </button>
        ))}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Quick actions"
          className="ft-fab pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform duration-300 hover:scale-105"
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>

      <IncomeFormDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSubmit={async (values) => {
          if (!user || !currentOrgId) return;
          try {
            await addIncome(currentOrgId, user.id, values);
            toast.success("Income added");
            setIncomeOpen(false);
          } catch (e: any) {
            toast.error(e.message ?? "Failed to save");
          }
        }}
      />
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSubmit={async (values) => {
          if (!user || !currentOrgId) return;
          try {
            await addExpense(currentOrgId, user.id, values);
            toast.success("Expense added");
            setExpenseOpen(false);
          } catch (e: any) {
            toast.error(e.message ?? "Failed to save");
          }
        }}
      />
    </>
  );
}
