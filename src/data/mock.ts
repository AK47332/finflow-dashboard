export type Txn = {
  id: string;
  kind: "income" | "expense";
  title: string;
  category: string;
  amount: number;
  date: string; // ISO
  client?: string;
  method: string;
};

export const transactions: Txn[] = [
  { id: "1", kind: "income", title: "Website redesign", category: "Service Fee", amount: 4200, date: "2026-04-18", client: "Acme Co.", method: "Bank Transfer" },
  { id: "2", kind: "expense", title: "Adobe Creative Cloud", category: "Software", amount: 79, date: "2026-04-17", method: "Card" },
  { id: "3", kind: "income", title: "Logo package", category: "Service Fee", amount: 850, date: "2026-04-16", client: "Northwind", method: "Mobile Banking" },
  { id: "4", kind: "expense", title: "Office rent", category: "Rent", amount: 1800, date: "2026-04-15", method: "Bank Transfer" },
  { id: "5", kind: "income", title: "Product sale — Tee Pack", category: "Sales", amount: 320, date: "2026-04-14", client: "Studio Lume", method: "Card" },
  { id: "6", kind: "expense", title: "Team lunch", category: "Food", amount: 124, date: "2026-04-13", method: "Cash" },
  { id: "7", kind: "income", title: "Consulting retainer", category: "Service Fee", amount: 2500, date: "2026-04-12", client: "Globex", method: "Bank Transfer" },
  { id: "8", kind: "expense", title: "Cloud hosting", category: "Software", amount: 210, date: "2026-04-11", method: "Card" },
  { id: "9", kind: "income", title: "App subscription", category: "Sales", amount: 49, date: "2026-04-10", client: "Pied Piper", method: "Card" },
  { id: "10", kind: "expense", title: "Marketing ads", category: "Marketing", amount: 640, date: "2026-04-09", method: "Card" },
];

export const monthly = [
  { month: "Nov", income: 8200, expense: 5400 },
  { month: "Dec", income: 9100, expense: 6100 },
  { month: "Jan", income: 10400, expense: 5800 },
  { month: "Feb", income: 9800, expense: 6700 },
  { month: "Mar", income: 12100, expense: 7200 },
  { month: "Apr", income: 13540, expense: 7820 },
];

export const expenseByCategory = [
  { name: "Rent", value: 1800 },
  { name: "Software", value: 1240 },
  { name: "Marketing", value: 980 },
  { name: "Salary", value: 2400 },
  { name: "Other", value: 540 },
];

export const incomeBySource = [
  { name: "Service Fee", value: 7550 },
  { name: "Sales", value: 3690 },
  { name: "Freelance", value: 1500 },
  { name: "Investment", value: 800 },
];

export const topClients = [
  { name: "Acme Co.", revenue: 8400, initial: "A" },
  { name: "Globex", revenue: 5200, initial: "G" },
  { name: "Northwind", revenue: 3100, initial: "N" },
  { name: "Studio Lume", revenue: 2200, initial: "S" },
  { name: "Pied Piper", revenue: 1450, initial: "P" },
];

export const reminders = [
  { id: "r1", title: "Send invoice to Acme", at: "Tomorrow · 09:00", priority: "high" as const },
  { id: "r2", title: "Pay office rent", at: "Apr 25 · 12:00", priority: "medium" as const },
  { id: "r3", title: "Renew domain", at: "Apr 28 · 18:00", priority: "low" as const },
];