import { useRef, useState } from "react";
import { Loader2, Upload, X, Plus, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  label?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
};

export function MultiImageUploader({
  label,
  values,
  onChange,
  folder = "products",
  max = 8,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = async (file: File) => {
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
      onChange([...values, data.publicUrl]);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = max - values.length;
    const list = Array.from(files).slice(0, room);
    for (const f of list) {
      // sequential to keep order
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(f);
    }
  };

  const remove = (idx: number) =>
    onChange(values.filter((_, i) => i !== idx));

  const addLink = () => {
    const url = linkValue.trim();
    if (!url) return;
    if (values.length >= max) {
      toast.error(`Maximum ${max} images`);
      return;
    }
    onChange([...values, url]);
    setLinkValue("");
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Thumbnails grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {values.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted"
            >
              <img src={url} alt={`image-${i}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">
          Drag & drop multiple images or click to choose ({values.length}/{max})
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy || values.length >= max}
        >
          {busy ? (
            <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading…</>
          ) : (
            <><Plus className="mr-1 h-3 w-3" /> Add images</>
          )}
        </Button>
      </div>

      {/* Add by link */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="Or paste image URL"
            className="h-9 pl-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addLink} disabled={!linkValue.trim() || values.length >= max}>
          <Upload className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  );
}