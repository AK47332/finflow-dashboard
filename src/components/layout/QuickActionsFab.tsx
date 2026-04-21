import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, StickyNote, Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { label: "Add Income", icon: TrendingUp, classes: "bg-income text-income-foreground" },
  { label: "Add Expense", icon: TrendingDown, classes: "bg-expense text-expense-foreground" },
  { label: "Add Note", icon: StickyNote, classes: "bg-profit text-profit-foreground" },
  { label: "Add Reminder", icon: Bell, classes: "bg-capital text-capital-foreground" },
];

export function QuickActionsFab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {actions.map((a, i) => (
        <button
          key={a.label}
          className={cn(
            "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lift transition-all duration-300",
            a.classes,
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0",
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
        className="ft-fab flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform duration-300 hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}