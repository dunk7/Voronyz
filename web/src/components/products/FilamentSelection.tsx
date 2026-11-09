"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  FILAMENT_MATERIALS,
  filamentMaterialFromVariant,
  filamentMaterialSoldOut,
  filamentVariantColor,
} from "@/lib/filament";

type FilamentSelectionValue = {
  key: string;
  setKey: (key: string) => void;
};

const FilamentSelectionContext = createContext<FilamentSelectionValue | null>(null);

export function FilamentPageFrame({
  enabled,
  initialKey,
  children,
}: {
  enabled: boolean;
  initialKey: string;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return <FilamentSelectionProvider initialKey={initialKey}>{children}</FilamentSelectionProvider>;
}

export function FilamentSelectionProvider({
  initialKey,
  children,
}: {
  initialKey: string;
  children: ReactNode;
}) {
  const [key, setKey] = useState(initialKey);
  const value = useMemo(() => ({ key, setKey }), [key]);
  return (
    <FilamentSelectionContext.Provider value={value}>{children}</FilamentSelectionContext.Provider>
  );
}

export function useFilamentSelection() {
  return useContext(FilamentSelectionContext);
}

export function FilamentMaterialFilters() {
  const selection = useFilamentSelection();
  if (!selection) return null;
  const materialId = selection.key.split(":")[0];

  return (
    <div className="mb-4 px-4 sm:px-6 lg:px-0">
      <p className="mb-2 text-sm text-neutral-700">Material</p>
      <div className="flex flex-wrap gap-2">
        {FILAMENT_MATERIALS.map((item) => {
          const selected = item.id === materialId;
          const soldOut = filamentMaterialSoldOut(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const currentColor = selection.key.split(":")[1];
                const color =
                  item.colors.find((entry) => entry.id === currentColor) ?? item.colors[0];
                selection.setKey(filamentVariantColor(item.id, color.id));
              }}
              className={`rounded-full px-4 py-2 text-sm ring-1 transition ${
                selected
                  ? "bg-black text-white ring-black"
                  : "bg-white text-neutral-900 ring-black/10 hover:bg-black/5"
              }`}
            >
              {item.label}
              {soldOut ? (
                <span className={`ml-2 text-[11px] font-semibold uppercase tracking-wide ${selected ? "text-white/70" : "text-neutral-400"}`}>
                  Sold out
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilamentMaterialDescription() {
  const selection = useFilamentSelection();
  const material = filamentMaterialFromVariant(selection?.key);
  return <p className="footwear-description">{material.description}</p>;
}

export function FilamentPrintSettings() {
  const selection = useFilamentSelection();
  const material = filamentMaterialFromVariant(selection?.key);

  return (
    <div className="mt-10 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
      <div className="bg-black px-6 py-4 text-sm font-medium text-white">
        Print settings · {material.label}
      </div>
      <div className="px-6 py-5 text-sm leading-relaxed text-neutral-700 sm:text-base">
        <p>{material.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {material.printNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
