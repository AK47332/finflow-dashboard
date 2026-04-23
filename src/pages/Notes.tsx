import { useMemo, useState, useEffect } from "react";
import { Pin, PinOff, Trash2, Pencil, Search, StickyNote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CrudShell } from "@/components/crud/CrudShell";
import { useOrgTable } from "@/hooks/useOrgTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FileAttachment, AttachmentValue } from "@/components/ui/FileAttachment";

type Note = {
  id: string;
  title: string | null;
  content: string;
  color: string;
  pinned: boolean;
  tags: string[] | null;
  updated_at: string;
  note_date: string;
  document_url: string | null;
  document_path: string | null;
  document_name: string | null;
  document_type: string | null;
};

const COLORS: Record<string, string> = {
  default: "bg-card",
  yellow: "bg-amber-100 dark:bg-amber-950/40",
  green: "bg-emerald-100 dark:bg-emerald-950/40",
  blue: "bg-sky-100 dark:bg-sky-950/40",
  pink: "bg-pink-100 dark:bg-pink-950/40",
  purple: "bg-violet-100 dark:bg-violet-950/40",
};
const COLOR_KEYS = Object.keys(COLORS);

export default function NotesPage() {
  const { rows, loading, create, update, remove } = useOrgTable<Note>("notes", {
    column: "updated_at",
    ascending: false,
  });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("default");
  const [tagsInput, setTagsInput] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [attachment, setAttachment] = useState<AttachmentValue>({
    url: null, path: null, name: null, type: null,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rows.filter((r) =>
          [r.title, r.content, ...(r.tags ?? [])]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        )
      : rows;
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [rows, search]);

  const pinnedCount = rows.filter((r) => r.pinned).length;

  const reset = () => {
    setTitle("");
    setContent("");
    setColor("default");
    setTagsInput("");
    setNoteDate(new Date().toISOString().slice(0, 10));
    setAttachment({ url: null, path: null, name: null, type: null });
    setEditing(null);
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };
  const openEdit = (n: Note) => {
    setEditing(n);
    setTitle(n.title ?? "");
    setContent(n.content);
    setColor(n.color);
    setTagsInput((n.tags ?? []).join(", "));
    setNoteDate(n.note_date ?? new Date().toISOString().slice(0, 10));
    setAttachment({
      url: n.document_url, path: n.document_path,
      name: n.document_name, type: n.document_type,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      return toast.error("Add a title or content");
    }
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: title.trim() || null,
        content: content.trim(),
        color,
        tags: tags.length ? tags : null,
        note_date: noteDate,
        document_url: attachment.url,
        document_path: attachment.path,
        document_name: attachment.name,
        document_type: attachment.type,
      };
      if (editing) await update(editing.id, payload);
      else await create({ ...payload, pinned: false });
      toast.success(editing ? "Note updated" : "Note added");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    }
  };

  const togglePin = async (n: Note) => {
    try {
      await update(n.id, { pinned: !n.pinned });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <CrudShell
      title="Notes"
      description="Quick notes, Google Keep style."
      loading={loading}
      empty={!loading && rows.length === 0}
      emptyText="No notes yet. Capture your first thought."
      onAdd={openAdd}
      addLabel="Add Note"
      addClassName="bg-gradient-primary text-primary-foreground hover:opacity-90"
      stats={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="ft-card p-5">
            <div className="flex items-center gap-3">
              <div className="ft-stat-icon bg-primary-soft text-primary">
                <StickyNote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold text-foreground">{rows.length}</p>
              </div>
            </div>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Pinned</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{pinnedCount}</p>
          </div>
          <div className="ft-card p-5">
            <p className="text-xs font-medium text-muted-foreground">Tagged</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {rows.filter((r) => r.tags && r.tags.length).length}
            </p>
          </div>
        </div>
      }
      toolbar={
        rows.length > 0 && (
          <div className="ft-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={cn(
              "group relative flex flex-col gap-2 rounded-xl border border-border p-4 shadow-soft transition-all hover:shadow-lift",
              COLORS[n.color] ?? COLORS.default,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              {n.title ? (
                <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-foreground">
                  {n.title}
                </h3>
              ) : (
                <span />
              )}
              <button
                onClick={() => togglePin(n)}
                aria-label={n.pinned ? "Unpin" : "Pin"}
                className="text-muted-foreground hover:text-primary"
              >
                {n.pinned ? (
                  <Pin className="h-4 w-4 fill-current text-primary" />
                ) : (
                  <PinOff className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            </div>
            {n.content && (
              <p className="line-clamp-[10] whitespace-pre-wrap text-sm text-foreground/80">
                {n.content}
              </p>
            )}
            {n.tags && n.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {n.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-[10px] text-muted-foreground">
                {new Date(n.updated_at).toLocaleDateString()}
              </span>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(n)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-expense hover:text-expense"
                  onClick={() => setPendingDelete(n)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Note" : "Add Note"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ntitle">Title</Label>
              <Input id="ntitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ncontent">Content</Label>
              <Textarea
                id="ncontent"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write something…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ntags">Tags (comma separated)</Label>
              <Input id="ntags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="ideas, todo" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setColor(k)}
                    aria-label={`Color ${k}`}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      COLORS[k],
                      color === k ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add Note"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
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
                  toast.success("Note deleted");
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
