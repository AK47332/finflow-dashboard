import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Reminder = {
  id: string;
  title: string;
  due_at: string;
  completed: boolean;
};

export function NotificationsBell() {
  const navigate = useNavigate();
  const { currentOrgId } = useOrg();
  const [items, setItems] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!currentOrgId) {
      setItems([]);
      return;
    }
    let cancel = false;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("reminders")
        .select("id, title, due_at, completed")
        .eq("organization_id", currentOrgId)
        .eq("completed", false)
        .order("due_at", { ascending: true })
        .limit(8);
      if (!cancel) setItems((data ?? []) as Reminder[]);
    };
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancel = true;
      window.clearInterval(id);
    };
  }, [currentOrgId]);

  const now = Date.now();
  const overdue = items.filter((r) => new Date(r.due_at).getTime() < now);
  const upcoming = items.filter((r) => new Date(r.due_at).getTime() >= now);
  const total = items.length;
  const hasOverdue = overdue.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span
              className={cn(
                "absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-card",
                hasOverdue
                  ? "bg-expense text-expense-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Reminders</span>
          {total > 0 && (
            <span className="text-[11px] font-normal text-muted-foreground">
              {overdue.length} overdue · {upcoming.length} upcoming
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {total === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            You're all caught up.
          </div>
        ) : (
          <>
            {[...overdue, ...upcoming].slice(0, 6).map((r) => {
              const isOverdue = new Date(r.due_at).getTime() < now;
              return (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => navigate("/reminders")}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        isOverdue ? "bg-expense" : "bg-primary",
                      )}
                    />
                    <span className="flex-1 truncate text-sm font-medium">{r.title}</span>
                  </div>
                  <span className="pl-4 text-[11px] text-muted-foreground">
                    {new Date(r.due_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {isOverdue && " · Overdue"}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/reminders")} className="justify-center text-sm font-semibold text-primary">
          View all reminders
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
