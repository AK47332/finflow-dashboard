import { create } from "zustand";
import { transactions as seed } from "@/data/mock";

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

const seedExpenses: Expense[] = seed
  .filter((t) => t.kind === "expense")
  .map((t) => ({
    id: t.id,
    title: t.title,
    amount: t.amount,
    date: t.date,
    category: t.category,
    paymentMethod: (t.method as PaymentMethod) ?? "Cash",
  }));

type ExpenseState = {
  expenses: Expense[];
  add: (e: Omit<Expense, "id">) => void;
  update: (id: string, patch: Partial<Expense>) => void;
  remove: (id: string) => void;
};

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: seedExpenses,
  add: (e) =>
    set((s) => ({
      expenses: [{ ...e, id: crypto.randomUUID() }, ...s.expenses],
    })),
  update: (id, patch) =>
    set((s) => ({
      expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),
  remove: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
}));