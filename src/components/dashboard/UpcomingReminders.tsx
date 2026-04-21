import { Bell } from "lucide-react";
import { reminders } from "@/data/mock";
import { cn } from "@/lib/utils";

const priorityClasses = {
  high: "border-l-expense bg-expense-soft/40",
  medium: "border-l-profit bg-profit-soft/40",
  low: "border-l-income bg-income-soft/40",
};

const priorityLabel = {
  high: { text: "High", classes: "bg-expense-soft text-expense" },
  medium: { text: "Medium", classes: "bg-profit-soft text-profit" },
  low: { text: "Low", classes: "bg-income-soft text-income" },
};

export function UpcomingReminders() {
  return (
    <div className="ft-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Upcoming reminders</h3>
          <p className="text-xs text-muted-foreground">Next 3</p>
        </div>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
      <ul className="space-y-3">
        {reminders.map((r) => {
          const p = priorityLabel[r.priority];
          return (
            <li
              key={r.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border-l-4 p-3",
                priorityClasses[r.priority],
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.at}</div>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", p.classes)}>
                {p.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}