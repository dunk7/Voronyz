/** Small grey catalog price — never a headline. Cart/checkout stay full-weight. */
export const SHOP_PRICE_CLASS =
  "text-xs font-normal tabular-nums tracking-wide text-neutral-400";

export function formatCentsAsCurrency(cents: number, currency: string = "usd") {
  const amount = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    }).format(amount);
  } catch {
    // Fallback: format without .00 if whole number
    const fixedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
    return `$${fixedAmount}`;
  }
}


