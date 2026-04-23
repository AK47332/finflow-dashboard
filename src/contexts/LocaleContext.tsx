import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

/**
 * Lightweight UI language layer. Keeps things simple by shipping a small
 * dictionary used by core navigation/labels. Pages keep their own copy in
 * English; this is a foundation we can grow without rewiring everything.
 */
export type Locale = "en" | "bn";

const STORAGE_KEY = "ui-locale";

const dict: Record<Locale, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.income": "Income",
    "nav.expense": "Expense",
    "nav.capital": "Capital",
    "nav.profitLoss": "Profit & Loss",
    "nav.clients": "Clients",
    "nav.products": "Products",
    "nav.services": "Services",
    "nav.receivables": "Receivables",
    "nav.payables": "Payables",
    "nav.notes": "Notes",
    "nav.reminders": "Reminders",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.pos": "POS",
    "nav.orders": "Orders",
    "nav.categories": "Categories",
    "nav.banners": "Banners",
    "nav.announcements": "Announcements",
    "nav.instagram": "Instagram Feed",
    "nav.pages": "Pages",
    "nav.contactWidget": "Contact Widget",
    "nav.footer": "Footer",
    "nav.customers": "Customers",
    "nav.frontendMood": "Frontend Mood",
    "nav.createAdmin": "Create Admin",
    "section.overview": "Overview",
    "section.money": "Money",
    "section.peopleCatalog": "People & Catalog",
    "section.ledger": "Ledger",
    "section.productivity": "Productivity",
    "section.insights": "Insights",
    "section.ecommerce": "Ecommerce",
    "section.admin": "Admin",
    "lang.toggle": "Language",
    "header.workspaces": "Workspaces",
    "header.createWorkspace": "+ Create new workspace",
    "header.search": "Jump to: income, expense, clients, reports…",
    "header.signOut": "Sign out",
    "header.openPos": "Open POS",
    "header.openMenu": "Open menu",
    "dash.welcome": "Welcome back",
    "dash.subtitle": "Here's how {org} is doing.",
    "dash.yourBusiness": "your business",
    "range.today": "Today",
    "range.week": "Week",
    "range.month": "Month",
    "range.year": "Year",
    "range.all": "All",
    "range.custom": "Custom",
    "range.pick": "Pick a custom range",
    "range.from": "From",
    "range.to": "To",
    "range.apply": "Apply",
    "stat.totalIncome": "Total Income",
    "stat.totalExpense": "Total Expense",
    "stat.netProfit": "Net Profit",
    "stat.capital": "Capital",
    "stat.receivables": "Receivables",
    "stat.payables": "Payables",
    "card.incomeVsExpense": "Income vs Expense",
    "card.last6Months": "Last 6 months",
    "card.income": "Income",
    "card.expense": "Expense",
    "card.expenseByCategory": "Expense by category",
    "card.incomeBySource": "Income by source",
    "card.thisToday": "Today",
    "card.thisWeek": "This week",
    "card.thisMonth": "This month",
    "card.thisYear": "This year",
    "card.allTime": "All time",
    "card.recentTransactions": "Recent transactions",
    "card.latestEntries": "Latest {n} entries",
    "card.viewAll": "View all",
    "card.noTxRange": "No transactions yet in this range.",
    "card.topClients": "Top clients",
    "card.byRevenue": "By revenue ({range})",
    "card.noClientRevenue": "No client revenue yet.",
    "card.upcomingReminders": "Upcoming reminders",
    "card.next": "Next {n}",
    "card.noReminders": "No reminders set.",
    "card.addReminder": "Add reminder",
    "card.noExpenseRange": "No expenses yet in this range.",
    "card.addExpense": "Add expense",
    "card.noIncomeRange": "No income yet in this range.",
    "card.addIncome": "Add income",
    "donut.total": "Total",
    "badge.overdue": "Overdue",
    "badge.upcoming": "Upcoming",
  },
  bn: {
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.income": "আয়",
    "nav.expense": "ব্যয়",
    "nav.capital": "মূলধন",
    "nav.profitLoss": "লাভ ও ক্ষতি",
    "nav.clients": "ক্লায়েন্ট",
    "nav.products": "পণ্য",
    "nav.services": "সেবা",
    "nav.receivables": "প্রাপ্য",
    "nav.payables": "প্রদেয়",
    "nav.notes": "নোট",
    "nav.reminders": "রিমাইন্ডার",
    "nav.reports": "রিপোর্ট",
    "nav.settings": "সেটিংস",
    "nav.pos": "পিওএস",
    "nav.orders": "অর্ডার",
    "nav.categories": "ক্যাটাগরি",
    "nav.banners": "ব্যানার",
    "nav.announcements": "ঘোষণা",
    "nav.instagram": "ইনস্টাগ্রাম ফিড",
    "nav.pages": "পেজ",
    "nav.contactWidget": "কন্টাক্ট উইজেট",
    "nav.footer": "ফুটার",
    "nav.customers": "কাস্টমার",
    "nav.frontendMood": "ফ্রন্টএন্ড মুড",
    "nav.createAdmin": "অ্যাডমিন তৈরি",
    "section.overview": "ওভারভিউ",
    "section.money": "অর্থ",
    "section.peopleCatalog": "মানুষ ও ক্যাটালগ",
    "section.ledger": "খাতা",
    "section.productivity": "প্রোডাক্টিভিটি",
    "section.insights": "ইনসাইট",
    "section.ecommerce": "ই-কমার্স",
    "section.admin": "অ্যাডমিন",
    "lang.toggle": "ভাষা",
    "header.workspaces": "ওয়ার্কস্পেস",
    "header.createWorkspace": "+ নতুন ওয়ার্কস্পেস তৈরি",
    "header.search": "যান: আয়, ব্যয়, ক্লায়েন্ট, রিপোর্ট…",
    "header.signOut": "সাইন আউট",
    "header.openPos": "পিওএস খুলুন",
    "header.openMenu": "মেনু খুলুন",
    "dash.welcome": "স্বাগতম",
    "dash.subtitle": "{org} কেমন চলছে দেখুন।",
    "dash.yourBusiness": "আপনার ব্যবসা",
    "range.today": "আজ",
    "range.week": "সপ্তাহ",
    "range.month": "মাস",
    "range.year": "বছর",
    "range.all": "সব",
    "range.custom": "কাস্টম",
    "range.pick": "কাস্টম পরিসর নির্বাচন",
    "range.from": "থেকে",
    "range.to": "পর্যন্ত",
    "range.apply": "প্রয়োগ",
    "stat.totalIncome": "মোট আয়",
    "stat.totalExpense": "মোট ব্যয়",
    "stat.netProfit": "নিট লাভ",
    "stat.capital": "মূলধন",
    "stat.receivables": "প্রাপ্য",
    "stat.payables": "প্রদেয়",
    "card.incomeVsExpense": "আয় বনাম ব্যয়",
    "card.last6Months": "গত ৬ মাস",
    "card.income": "আয়",
    "card.expense": "ব্যয়",
    "card.expenseByCategory": "ক্যাটাগরি অনুযায়ী ব্যয়",
    "card.incomeBySource": "উৎস অনুযায়ী আয়",
    "card.thisToday": "আজ",
    "card.thisWeek": "এই সপ্তাহ",
    "card.thisMonth": "এই মাস",
    "card.thisYear": "এই বছর",
    "card.allTime": "সর্বকাল",
    "card.recentTransactions": "সাম্প্রতিক লেনদেন",
    "card.latestEntries": "সর্বশেষ {n} এন্ট্রি",
    "card.viewAll": "সব দেখুন",
    "card.noTxRange": "এই পরিসরে এখনো কোনো লেনদেন নেই।",
    "card.topClients": "শীর্ষ ক্লায়েন্ট",
    "card.byRevenue": "আয় অনুসারে ({range})",
    "card.noClientRevenue": "এখনো ক্লায়েন্ট আয় নেই।",
    "card.upcomingReminders": "আসন্ন রিমাইন্ডার",
    "card.next": "পরবর্তী {n}",
    "card.noReminders": "কোনো রিমাইন্ডার নেই।",
    "card.addReminder": "রিমাইন্ডার যোগ",
    "card.noExpenseRange": "এই পরিসরে কোনো ব্যয় নেই।",
    "card.addExpense": "ব্যয় যোগ",
    "card.noIncomeRange": "এই পরিসরে কোনো আয় নেই।",
    "card.addIncome": "আয় যোগ",
    "donut.total": "মোট",
    "badge.overdue": "বকেয়া",
    "badge.upcoming": "আসন্ন",
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function readInitial(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "bn" ? "bn" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.setAttribute("lang", locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = dict[locale][key] ?? dict.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}