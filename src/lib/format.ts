export const currency = (n: number, symbol = "$") =>
  `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const compactCurrency = (n: number, symbol = "$") => {
  if (Math.abs(n) >= 1000) {
    return `${symbol}${(n / 1000).toFixed(1)}k`;
  }
  return `${symbol}${n}`;
};