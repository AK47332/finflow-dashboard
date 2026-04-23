import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type RecordField = {
  label: string;
  value: ReactNode;
  full?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  fields: RecordField[];
  footer?: ReactNode;
};

export function RecordViewDialog({ open, onOpenChange, title, description, fields, footer }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f, i) => (
            <div key={i} className={f.full ? "sm:col-span-2" : undefined}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {f.label}
              </p>
              <div className="mt-1 break-words text-sm text-foreground">
                {f.value ?? <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          {footer}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}