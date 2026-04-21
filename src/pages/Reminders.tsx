import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Check, Pencil, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  completed: boolean;
  completed_at: string | null;
  notify: boolean;
};

type FilterTab = "upcoming" | "overdue" | "completed" | "all";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDueAt() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

export default function RemindersPage() {
  const { rows, loading, create, update, remove } = useOrgTable<Reminder>("reminders", {
    column: "due_at",
    ascending: true,
  });
  const [tab, setTab] = useState<FilterTab>("upcoming");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Reminder | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(defaultDueAt());
  const [notify, setNotify] = useState(true);

  // Browser notifications: ask permission once
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      // Don't auto-request — user can opt-in via switch
    }
  }, []);

  // Fire browser notifications for due reminders (every 30s)
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const fired = new Set<string>();
    const tick = () => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      rows.forEach((r) => {
        if (r.completed || !r.notify) return;
        const due = new Date(r.due_at).getTime();
        if (due <= now && due > now - 5 * 60 * 1000 && !fired.has(r.id)) {
          fired.add(r.id);
          new Notification(r.title, {
            body: r.description ?? "Reminder is due now",
            tag: r.id,
          });
        }
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [rows]);

  const now = Date.now();
  const counts = useMemo(() => {
    let upcoming = 0,
      overdue = 0,
      completed = 0;
    rows.forEach((r) => {
      if (r.completed) completed++;
      else if (new Date(r.due_at).getTime() < now) overdue++;
      else upcoming++;
    });
    return { upcoming, overdue, completed, all: rows.length };
  }, [rows, now]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const due = new Date(r.due_at).getTime();
      if (tab === "completed") return r.completed;
      if (tab === "overdue") return !r.completed && due < now;
      if (tab === "upcoming") return !r.completed && due >= now;
      return true;
    });
  }, [rows, tab, now]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueAt(defaultDueAt());
    setNotify(true);
    setEditing(null);
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };
  const openEdit = (r: Reminder) => {
    setEditing(r);
    setTitle(r.title);
    setDescription(r.description ?? "");
    setDueAt(toLocalInput(r.due_at));
    setNotify(r.notify);
    setOpen(true);
  };

  const requestPermissionIfNeeded = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    if (!dueAt) return toast.error("Pick a due date and time");
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_at: new Date(dueAt).toISOString(),
        notify,
      };
      if (notify) await requestPermissionIfNeeded();
      if (editing) await update(editing.id, payload);
      else await create({ ...payload, completed: false });
      toast.success(editing ? "Reminder updated" : "Reminder added");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
  };

  const toggleComplete = async (r: Reminder) => {
    try {
      await update(r.id, {
        completed: !r.completed,
        completed_at: !r.completed ? new Date().toISOString() : null,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <CrudShell
      title="Reminders"
      description="Never miss a deadline again."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No reminders yet. Schedule your first one."
      onAdd={openAdd}
      addLabel="Add Reminder"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{counts.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-expense">{counts.overdue}</p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
            <p className="mt-1 text-2xl font-bold text-income">{counts.completed}</p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{counts.all}</p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({counts.overdue})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            </TabsList>
          </Tabs>
        )
      }
    >
      {filtered.length === 0 ? (
        <div className="ft-card p-8 text-center text-sm text-muted-foreground">
          Nothing in this view.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const due = new Date(r.due_at).getTime();
            const overdue = !r.completed && due < now;
            return (
              <div
                key={r.id}
                className={cn(
                  "ft-card flex items-start gap-3 p-4 transition-all",
                  r.completed && "opacity-60",
                )}
              >
                <button
                  onClick={() => toggleComplete(r)}
                  aria-label={r.completed ? "Mark active" : "Mark complete"}
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                    r.completed
                      ? "border-income bg-income text-income-foreground"
                      : "border-border hover:border-primary",
                  )}
                >
                  {r.completed && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold text-foreground",
                        r.completed && "line-through",
                      )}
                    >
                      {r.title}
                    </h3>
                    {overdue && (
                      <span className="rounded-full bg-expense/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-expense">
                        Overdue
                      </span>
                    )}
                    {!r.notify && (
                      <BellOff className="h-3 w-3 text-muted-foreground" aria-label="Notifications off" />
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {fmt(r.due_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPendingDelete(r)}
                    aria-label="Delete"
                    className="text-expense hover:text-expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Reminder" : "Add Reminder"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rtitle">Title *</Label>
              <Input id="rtitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pay vendor invoice" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdesc">Description</Label>
              <Textarea id="rdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdue">Due *</Label>
              <Input
                id="rdue"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Browser notification</p>
                  <p className="text-xs text-muted-foreground">Notify me when this is due</p>
                </div>
              </div>
              <Switch checked={notify} onCheckedChange={setNotify} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add Reminder"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense text-expense-foreground hover:bg-expense/90"
              onClick={async () => {
                if (!pendingDelete) return;
                try {
                  await remove(pendingDelete.id);
                  toast.success("Reminder deleted");
                  setPendingDelete(null);
                } catch (e: any) {
                  toast.error(e.message ?? "Failed");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrudShell>
  );
}
