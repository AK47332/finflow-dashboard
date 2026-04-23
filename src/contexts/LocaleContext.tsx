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
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
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
    (key: string) => dict[locale][key] ?? dict.en[key] ?? key,
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