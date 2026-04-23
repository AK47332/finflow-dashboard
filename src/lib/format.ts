/**
 * Currency formatting.
 * The active symbol is kept as a module-level value so every existing
 * `currency(n)` call automatically reflects the current organization's
 * currency setting (set via setActiveCurrency in the React context).
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  CNY: "¥",
  BRL: "R$",
  MXN: "Mex$",
  ZAR: "R",
  AED: "د.إ",
  BDT: "৳",
  PKR: "₨",
};

let activeSymbol = "$";

export function symbolForCurrency(code?: string | null): string {
  if (!code) return "$";
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];
  try {
    const intl = new Intl.NumberFormat(undefined, { style: "currency", currency: code })
      .format(0)
      .replace(/[\d.,\s]/g, "");
    return intl || code;
  } catch {
    return code;
  }
}

export function setActiveCurrency(code?: string | null) {
  activeSymbol = symbolForCurrency(code);
}

export function getActiveCurrencySymbol() {
  return activeSymbol;
}

export const currency = (n: number, symbol?: string) => {
  const s = symbol ?? activeSymbol;
  return `${s}${(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const compactCurrency = (n: number, symbol?: string) => {
  const s = symbol ?? activeSymbol;
  if (Math.abs(n) >= 1000) return `${s}${(n / 1000).toFixed(1)}k`;
  return `${s}${n}`;
};