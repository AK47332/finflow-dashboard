import { supabase } from "@/integrations/supabase/client";

export const INCOME_BUCKET = "income-attachments";

export type UploadedAttachment = {
  path: string;
  url: string;
  name: string;
  type: string;
};

export async function uploadIncomeAttachment(file: File): Promise<UploadedAttachment> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;

  const { error } = await supabase.storage
    .from(INCOME_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(INCOME_BUCKET).getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
    name: safeName,
    type: file.type || "application/octet-stream",
  };
}

export async function deleteIncomeAttachment(path: string): Promise<void> {
  const { error } = await supabase.storage.from(INCOME_BUCKET).remove([path]);
  if (error) throw error;
}