export function formatCentsAsCurrency(cents: number, currency: string = "usd") {
  const amount = (cents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}


