import { ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  onAdd: () => void;
  addLabel: string;
  stats?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  addClassName?: string;
};

export function CrudShell({
  title,
  description,
  loading,
  empty,
  emptyText = "Nothing here yet.",
  onAdd,
  addLabel,
  stats,
  toolbar,
  children,
  addClassName,
}: Props) {
  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button onClick={onAdd} className={addClassName}>
          <Plus className="h-4 w-4" /> {addLabel}
        </Button>
      </header>

      {stats}
      {toolbar}

      {loading ? (
        <div className="ft-card flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : empty ? (
        <div className="ft-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
          <Button variant="outline" onClick={onAdd}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}