import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Income } from "@/store/incomeStore";
import type { Expense } from "@/store/expenseStore";
import { currency } from "@/lib/format";

export function exportIncomesCSV(rows: Income[], filename = "income.csv") {
  const headers = [
    "Date",
    "Title",
    "Category",
    "Type",
    "Client",
    "Amount",
    "Payment Method",
    "Description",
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.date,
        r.title,
        r.category,
        r.type,
        r.client ?? "",
        r.amount,
        r.paymentMethod,
        r.description ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function exportIncomesPDF(rows: Income[], filename = "income.pdf") {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Income Report", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  doc.text(
    `${rows.length} entries · Total ${currency(total)}`,
    14,
    22,
  );

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Title", "Category", "Client", "Method", "Amount"]],
    body: rows.map((r) => [
      r.date,
      r.title,
      r.category,
      r.client ?? "—",
      r.paymentMethod,
      currency(r.amount),
    ]),
    headStyles: { fillColor: [124, 58, 237] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportExpensesCSV(rows: Expense[], filename = "expense.csv") {
  const headers = [
    "Date",
    "Title",
    "Category",
    "Vendor",
    "Amount",
    "Payment Method",
    "Recurring",
    "Description",
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.date,
        r.title,
        r.category,
        r.vendor ?? "",
        r.amount,
        r.paymentMethod,
        r.isRecurring ? r.recurrence ?? "Yes" : "",
        r.description ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function exportExpensesPDF(rows: Expense[], filename = "expense.pdf") {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Expense Report", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  doc.text(`${rows.length} entries · Total ${currency(total)}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Date", "Title", "Category", "Vendor", "Method", "Amount"]],
    body: rows.map((r) => [
      r.date,
      r.title,
      r.category,
      r.vendor ?? "—",
      r.paymentMethod,
      currency(r.amount),
    ]),
    headStyles: { fillColor: [244, 63, 94] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}