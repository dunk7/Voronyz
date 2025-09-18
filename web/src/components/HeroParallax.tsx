"use client";
import { useEffect, useRef } from "react";

export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      const translate = Math.min(0, -y * 0.06);
      el.style.transform = `translateY(${translate}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}


