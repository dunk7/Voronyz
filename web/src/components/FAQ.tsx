"use client";
import { useState } from "react";

export type FAQItem = {
  q: string;
  a: string;
};

export default function FAQ({ items, className = "" }: { items: FAQItem[]; className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className={`divide-y divide-black/10 rounded-2xl ring-1 ring-black/5 ${className}`}>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={i}>
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span className="text-sm font-medium text-neutral-900">{item.q}</span>
              <span className={`w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold transition-transform ${open ? "rotate-45" : ""}`}>+</span>
            </button>
            <div className={`overflow-hidden px-5 transition-[max-height] duration-300 ${open ? "max-h-96 pb-5" : "max-h-0"}`}>
              <p className="text-sm leading-6 text-neutral-700">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}


