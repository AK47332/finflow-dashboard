import { create } from "zustand";
import { transactions as seed } from "@/data/mock";

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

const seedIncomes: Income[] = seed
  .filter((t) => t.kind === "income")
  .map((t) => ({
    id: t.id,
    title: t.title,
    amount: t.amount,
    date: t.date,
    type: "General" as IncomeType,
    category: t.category,
    client: t.client,
    paymentMethod: (t.method as PaymentMethod) ?? "Cash",
  }));

type IncomeState = {
  incomes: Income[];
  add: (i: Omit<Income, "id">) => void;
  update: (id: string, patch: Partial<Income>) => void;
  remove: (id: string) => void;
};

export const useIncomeStore = create<IncomeState>((set) => ({
  incomes: seedIncomes,
  add: (i) =>
    set((s) => ({
      incomes: [{ ...i, id: crypto.randomUUID() }, ...s.incomes],
    })),
  update: (id, patch) =>
    set((s) => ({
      incomes: s.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    })),
  remove: (id) => set((s) => ({ incomes: s.incomes.filter((x) => x.id !== id) })),
}));