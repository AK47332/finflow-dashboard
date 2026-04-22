import { useRef, useState } from "react";
import { Loader2, Upload, X, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** subfolder inside the bucket, e.g. "categories", "banners", "logos" */
  folder?: string;
  /** preview height class, default h-32 */
  previewClassName?: string;
  placeholder?: string;
};

export function ImageUploader({
  label,
  value,
  onChange,
  folder = "misc",
  previewClassName,
  placeholder = "https://…",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("ecom-assets")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("ecom-assets").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
            mode === "upload" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          <Upload className="h-3 w-3" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
            mode === "link" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          <LinkIcon className="h-3 w-3" /> Paste link
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void onFile(f);
          }}
          className="relative flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center"
        >
          {value ? (
            <div className={cn("relative w-full overflow-hidden rounded-lg bg-muted", previewClassName ?? "h-32")}>
              <img src={value} alt="preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="py-3 text-xs text-muted-foreground">
              Drag & drop or click to select an image
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-3 w-3" /> {value ? "Replace" : "Choose image"}</>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {value && (
            <div className={cn("overflow-hidden rounded-lg bg-muted", previewClassName ?? "h-32")}>
              <img src={value} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}