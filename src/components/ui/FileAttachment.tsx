import { useRef, useState } from "react";
import { Loader2, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/contexts/OrgContext";
import {
  uploadLedgerAttachment,
  deleteLedgerAttachment,
} from "@/lib/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type AttachmentValue = {
  url: string | null;
  path: string | null;
  name: string | null;
  type: string | null;
};

type Props = {
  label?: string;
  value: AttachmentValue;
  onChange: (v: AttachmentValue) => void;
  className?: string;
};

const EMPTY: AttachmentValue = { url: null, path: null, name: null, type: null };

export function FileAttachment({ label = "Attachment", value, onChange, className }: Props) {
  const { currentOrgId } = useOrg();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    if (!currentOrgId) {
      toast.error("No active workspace");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setBusy(true);
    try {
      // Delete previous if any
      if (value.path) {
        try {
          await deleteLedgerAttachment(value.path);
        } catch {
          /* ignore */
        }
      }
      const up = await uploadLedgerAttachment(file, currentOrgId);
      onChange({ url: up.url, path: up.path, name: up.name, type: up.type });
      toast.success("File attached");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (value.path) {
      try {
        await deleteLedgerAttachment(value.path);
      } catch {
        /* ignore */
      }
    }
    onChange(EMPTY);
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      {value.url ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
          <FileText className="h-4 w-4 text-primary" />
          <a
            href={value.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 truncate text-sm text-foreground hover:underline"
          >
            {value.name ?? "Attached file"}
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => void clear()}
            aria-label="Remove file"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Paperclip className="h-3.5 w-3.5" /> Attach a file
              </>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground">PDF, image, or document up to 10 MB</p>
        </div>
      )}
    </div>
  );
}