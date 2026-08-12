"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import type { ApparelCatalogItem } from "@/lib/apparel";

type ApparelStyleSwitcherProps = {
  options: ApparelCatalogItem[];
  activeSlug: string;
};

export default function ApparelStyleSwitcher({
  options,
  activeSlug,
}: ApparelStyleSwitcherProps) {
  const router = useRouter();
  const [navigatingSlug, setNavigatingSlug] = useState<string | null>(null);

  if (options.length < 2) return null;

  const activeKey = activeSlug.trim().toLowerCase();

  function selectStyle(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    if (slug.trim().toLowerCase() === activeKey) return;
    setNavigatingSlug(slug);
    router.push(`/products/${slug}`);
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm text-neutral-700">Style</label>
      <div className="grid gap-2">
        {options.map((option) => {
          const isSelected = option.slug.trim().toLowerCase() === activeKey;
          const isNavigating = navigatingSlug === option.slug;
          return (
            <Link
              key={option.slug}
              href={`/products/${option.slug}`}
              onClick={(e) => selectStyle(e, option.slug)}
              aria-current={isSelected ? "page" : undefined}
              className={`flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${
                isSelected
                  ? "bg-black text-white ring-black"
                  : "bg-white text-neutral-900 ring-black/10 hover:bg-black/5"
              } ${isNavigating ? "pointer-events-none opacity-70" : ""}`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold tracking-wide">
                  {option.styleLabel ?? option.name}
                </span>
                <span
                  className={`mt-0.5 block text-xs leading-relaxed ${
                    isSelected ? "text-white/80" : "text-neutral-500"
                  }`}
                >
                  {option.description}
                </span>
              </span>
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  isSelected ? "text-white" : "text-neutral-900"
                }`}
              >
                {formatCentsAsCurrency(option.priceCents)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
