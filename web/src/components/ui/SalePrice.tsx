import { formatCentsAsCurrency } from "@/lib/money";

type SalePriceProps = {
  priceCents: number;
  compareAtCents?: number | null;
  percentOff?: number | null;
  quantity?: number;
  size?: "card" | "product";
};

export default function SalePrice({
  priceCents,
  compareAtCents,
  percentOff,
  quantity = 1,
  size = "product",
}: SalePriceProps) {
  const qty = Math.max(1, quantity);
  const sale = priceCents * qty;
  const was = typeof compareAtCents === "number" ? compareAtCents * qty : null;
  const showCompare = typeof was === "number" && was > sale;
  const off =
    typeof percentOff === "number" && percentOff > 0
      ? percentOff
      : showCompare && was
        ? Math.round((1 - sale / was) * 100)
        : 0;

  const priceClass =
    size === "card"
      ? "text-sm font-semibold tabular-nums text-neutral-900"
      : "text-lg font-semibold tabular-nums text-neutral-900";
  const wasClass =
    size === "card"
      ? "text-xs tabular-nums text-neutral-400 line-through"
      : "text-sm tabular-nums text-neutral-400 line-through";

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {showCompare ? <span className={wasClass}>{formatCentsAsCurrency(was)}</span> : null}
      <span className={priceClass}>{formatCentsAsCurrency(sale)}</span>
      {off > 0 ? (
        <span
          className={
            size === "card"
              ? "text-[11px] font-semibold uppercase tracking-wide text-red-600"
              : "rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
          }
        >
          {off}% off
        </span>
      ) : null}
    </div>
  );
}
