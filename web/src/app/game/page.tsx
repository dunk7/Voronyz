import type { Metadata } from "next";
import StoreNavGame from "@/components/game/StoreNavGame";

export const metadata: Metadata = {
  title: "Game – Voronyz Store",
  description:
    "Tap to stroll a cute top-down Voronyz store. Explore aisles, collect sparkles, and find your way around.",
};

export default function GamePage() {
  return (
    <div
      className="min-h-[calc(100vh-5rem)]"
      style={{
        background:
          "linear-gradient(165deg, #fff8f1 0%, #ffeef5 38%, #eef9ff 72%, #fff6e8 100%)",
      }}
    >
      <div className="container py-10 md:py-14 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="uppercase tracking-[0.28em] text-xs text-rose-400 font-semibold">
            Voronyz Play
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold text-neutral-900"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Store Stroll
          </h1>
          <p className="text-neutral-600 text-base md:text-lg leading-relaxed">
            Tap where you want to go — you stay centered while the big store map moves. On phone, hit Full screen for landscape play without tilting.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <StoreNavGame />
        </div>
      </div>
    </div>
  );
}
