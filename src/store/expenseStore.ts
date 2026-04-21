import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type RecurrenceFrequency = "Daily" | "Weekly" | "Monthly" | "Yearly";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Mobile Banking" | "Card" | "Other";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  category: string;
  vendor?: string;
  paymentMethod: PaymentMethod;
  description?: string;
  isRecurring?: boolean;
  recurrence?: RecurrenceFrequency;
  nextDueDate?: string;
  tags?: string[];
  documentName?: string;
  documentType?: string;
  documentPath?: string;
  documentUrl?: string;
};

export const EXPENSE_CATEGORIES = [
  "Salary",
  "Rent",
  "Utilities",
  "Marketing",
  "Supplies",
  "Software",
  "Transport",
  "Food",
  "Equipment",
  "Other",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Bank Transfer",
  "Mobile Banking",
  "Card",
  "Other",
];

function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    vendor: row.vendor ?? undefined,
    paymentMethod: (row.payment_method ?? "Cash") as PaymentMethod,
    description: row.description ?? undefined,
    isRecurring: row.is_recurring ?? false,
    recurrence: (row.recurrence ?? undefined) as RecurrenceFrequency | undefined,
    nextDueDate: row.next_due_date ?? undefined,
    tags: row.tags ?? undefined,
    documentName: row.document_name ?? undefined,
    documentType: row.document_type ?? undefined,
    documentPath: row.document_path ?? undefined,
    documentUrl: row.document_url ?? undefined,
  };
}

function expenseToRow(e: Omit<Expense, "id">) {
  return {
    title: e.title,
    amount: e.amount,
    date: e.date,
    category: e.category,
    vendor: e.vendor ?? null,
    payment_method: e.paymentMethod,
    description: e.description ?? null,
    is_recurring: e.isRecurring ?? false,
    recurrence: e.recurrence ?? null,
    next_due_date: e.nextDueDate ?? null,
    tags: e.tags && e.tags.length ? e.tags : null,
    document_name: e.documentName ?? null,
    document_type: e.documentType ?? null,
    document_path: e.documentPath ?? null,
    document_url: e.documentUrl ?? null,
  };
}

type ExpenseState = {
  expenses: Expense[];
  loading: boolean;
  loadedOrgId: string | null;
  fetch: (orgId: string) => Promise<void>;
  add: (orgId: string, userId: string, e: Omit<Expense, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Expense>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  loading: false,
  loadedOrgId: null,
  fetch: async (orgId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("organization_id", orgId)
      .order("date", { ascending: false });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({
      expenses: (data ?? []).map(rowToExpense),
      loading: false,
      loadedOrgId: orgId,
    });
  },
  add: async (orgId, userId, e) => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...expenseToRow(e), organization_id: orgId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ expenses: [rowToExpense(data), ...s.expenses] }));
  },
  update: async (id, patch) => {
    const row: any = {};
    const map: Record<string, string> = {
      title: "title",
      amount: "amount",
      date: "date",
      category: "category",
      vendor: "vendor",
      paymentMethod: "payment_method",
      description: "description",
      isRecurring: "is_recurring",
      recurrence: "recurrence",
      nextDueDate: "next_due_date",
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
      .from("expenses")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    set((s) => ({
      expenses: s.expenses.map((x) => (x.id === id ? rowToExpense(data) : x)),
    }));
  },
  remove: async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
  },
  reset: () => set({ expenses: [], loadedOrgId: null }),
}));