import { supabase } from "@/integrations/supabase/client";

export const INCOME_BUCKET = "income-attachments";
export const EXPENSE_BUCKET = "expense-attachments";
export const LEDGER_BUCKET = "ledger-attachments";

export type UploadedAttachment = {
  path: string;
  url: string;
  name: string;
  type: string;
};

async function uploadAttachment(bucket: string, file: File): Promise<UploadedAttachment> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${crypto.randomUUID()}${ext ? "." + ext : ""}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
    name: safeName,
    type: file.type || "application/octet-stream",
  };
}

async function deleteAttachment(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export const uploadIncomeAttachment = (file: File) => uploadAttachment(INCOME_BUCKET, file);
export const deleteIncomeAttachment = (path: string) => deleteAttachment(INCOME_BUCKET, path);
export const uploadExpenseAttachment = (file: File) => uploadAttachment(EXPENSE_BUCKET, file);
export const deleteExpenseAttachment = (path: string) => deleteAttachment(EXPENSE_BUCKET, path);

/**
 * Upload to ledger-attachments under an org-scoped folder so RLS allows it.
 * Used for receivables, payables, and notes.
 */
export async function uploadLedgerAttachment(
  file: File,
  orgId: string,
): Promise<UploadedAttachment> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${orgId}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;

  const { error } = await supabase.storage
    .from(LEDGER_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(LEDGER_BUCKET).getPublicUrl(path);
  return {
    path,
    url: data.publicUrl,
    name: safeName,
    type: file.type || "application/octet-stream",
  };
}

export const deleteLedgerAttachment = (path: string) =>
  deleteAttachment(LEDGER_BUCKET, path);