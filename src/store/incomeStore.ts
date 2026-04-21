import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type IncomeType = "General" | "Product" | "Service";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Mobile Banking" | "Card" | "Other";

export type Income = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  type: IncomeType;
  category: string;
  client?: string;
  paymentMethod: PaymentMethod;
  description?: string;
  isPartial?: boolean;
  remainingDue?: number;
  tags?: string[];
  documentName?: string;
  documentType?: string;
  documentPath?: string; // storage path inside the bucket
  documentUrl?: string;  // public URL for download
};

export const INCOME_CATEGORIES = [
  "Sales",
  "Service Fee",
  "Freelance",
  "Investment",
  "Rental",
  "Other",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "Mobile Banking",
  "Card",
  "Other",
];

function rowToIncome(row: any): Income {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    date: row.date,
    type: (row.type ?? "General") as IncomeType,
    category: row.category,
    client: row.client ?? undefined,
    paymentMethod: (row.payment_method ?? "Cash") as PaymentMethod,
    description: row.description ?? undefined,
    isPartial: row.is_partial ?? false,
    remainingDue: row.remaining_due != null ? Number(row.remaining_due) : undefined,
    tags: row.tags ?? undefined,
    documentName: row.document_name ?? undefined,
    documentType: row.document_type ?? undefined,
    documentPath: row.document_path ?? undefined,
    documentUrl: row.document_url ?? undefined,
  };
}

function incomeToRow(i: Omit<Income, "id">) {
  return {
    title: i.title,
    amount: i.amount,
    date: i.date,
    type: i.type,
    category: i.category,
    client: i.client ?? null,
    payment_method: i.paymentMethod,
    description: i.description ?? null,
    is_partial: i.isPartial ?? false,
    remaining_due: i.remainingDue ?? null,
    tags: i.tags && i.tags.length ? i.tags : null,
    document_name: i.documentName ?? null,
    document_type: i.documentType ?? null,
    document_path: i.documentPath ?? null,
    document_url: i.documentUrl ?? null,
  };
}

type IncomeState = {
  incomes: Income[];
  loading: boolean;
  loadedOrgId: string | null;
  fetch: (orgId: string) => Promise<void>;
  add: (orgId: string, userId: string, i: Omit<Income, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Income>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
};

export const useIncomeStore = create<IncomeState>((set) => ({
  incomes: [],
  loading: false,
  loadedOrgId: null,
  fetch: async (orgId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .eq("organization_id", orgId)
      .order("date", { ascending: false });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({
      incomes: (data ?? []).map(rowToIncome),
      loading: false,
      loadedOrgId: orgId,
    });
  },
  add: async (orgId, userId, i) => {
    const { data, error } = await supabase
      .from("incomes")
      .insert({ ...incomeToRow(i), organization_id: orgId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ incomes: [rowToIncome(data), ...s.incomes] }));
  },
  update: async (id, patch) => {
    const row: any = {};
    const map: Record<string, string> = {
      title: "title",
      amount: "amount",
      date: "date",
      type: "type",
      category: "category",
      client: "client",
      paymentMethod: "payment_method",
      description: "description",
      isPartial: "is_partial",
      remainingDue: "remaining_due",
      tags: "tags",
      documentName: "document_name",
      documentType: "document_type",
      documentPath: "document_path",
      documentUrl: "document_url",
    };
    Object.entries(patch).forEach(([k, v]) => {
      const col = map[k];
      if (col) row[col] = v ?? null;
    });
    const { data, error } = await supabase
      .from("incomes")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    set((s) => ({
      incomes: s.incomes.map((x) => (x.id === id ? rowToIncome(data) : x)),
    }));
  },
  remove: async (id) => {
    const { error } = await supabase.from("incomes").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ incomes: s.incomes.filter((x) => x.id !== id) }));
  },
  reset: () => set({ incomes: [], loadedOrgId: null }),
}));