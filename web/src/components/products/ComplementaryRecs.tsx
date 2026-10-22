import Image from "next/image";
import Link from "next/link";
import { formatCentsAsCurrency } from "@/lib/money";
import type { ComplementaryRecommendation } from "@/lib/complementaryRecommendations";

type ComplementaryRecsProps = {
  recs: ComplementaryRecommendation[];
  heading: string;
  ctaLabel?: string;
};

export default function ComplementaryRecs({
  recs,
  heading,
  ctaLabel = "Shop",
}: ComplementaryRecsProps) {
  if (recs.length === 0) return null;

  return (
    <section className="text-left" aria-label={heading}>
      <h2 className="text-lg font-semibold text-black">{heading}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {recs.map((rec) => (
          <Link
            key={rec.slug}
            href={rec.href}
            className="flex gap-3 rounded-xl ring-1 ring-black/10 bg-white p-3 hover:bg-neutral-50 transition-colors"
          >
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 bg-neutral-100">
              <Image
                src={rec.image}
                alt={rec.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-black truncate">{rec.name}</div>
              <p className="mt-0.5 text-xs text-neutral-600 leading-snug">{rec.reason}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm tabular-nums text-neutral-700">
                  {formatCentsAsCurrency(rec.priceCents)}
                </span>
                <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                  {ctaLabel}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
