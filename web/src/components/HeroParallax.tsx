"use client";
import { useEffect, useRef, useState } from "react";

type FrameSource = HTMLCanvasElement | HTMLImageElement;

/** Knock out near-black JPEG pixels so the hero Voronoi lattice shows through. */
function knockOutBlackBackground(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const cctx = c.getContext("2d", { willReadFrequently: true });
  if (!cctx) return c;
  cctx.drawImage(img, 0, 0);
  const imageData = cctx.getImageData(0, 0, c.width, c.height);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i]! < 24 && px[i + 1]! < 24 && px[i + 2]! < 24) {
      px[i + 3] = 0;
    }
  }
  cctx.putImageData(imageData, 0, 0);
  return c;
}

export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const smoothedRef = useRef(0);
  const [smoothedProgress, setSmoothedProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const framesRef = useRef<(FrameSource | null)[]>([]);
  const frameCount = 20;
  const revealedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const elementTop = el.offsetTop;
        const elementHeight = el.offsetHeight || 1;
        const rawProgress = Math.max(0, Math.min(1, (y - elementTop) / elementHeight));
        smoothedRef.current = rawProgress;
        setSmoothedProgress(rawProgress);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = ref.current;
    if (!canvas || !container) return;

    let isMounted = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const findNearestLoadedIndex = (targetIndex: number): number | null => {
      if (framesRef.current[targetIndex]) return targetIndex;
      for (let offset = 1; offset < frameCount; offset++) {
        const left = targetIndex - offset;
        const right = targetIndex + offset;
        if (left >= 0 && framesRef.current[left]) return left;
        if (right < frameCount && framesRef.current[right]) return right;
      }
      return null;
    };

    const renderFrame = (progress: number) => {
      const total = frameCount;
      const idx = progress >= 0.999 ? total - 1 : Math.floor(progress * (total - 1));
      const frameIndex = Math.max(0, Math.min(total - 1, idx));
      const nearest = findNearestLoadedIndex(frameIndex);
      if (nearest === null) return;
      const img = framesRef.current[nearest]!;

      const { width: logicalWidth, height: logicalHeight } = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const targetWidth = Math.max(1, Math.round(logicalWidth * dpr));
      const targetHeight = Math.max(1, Math.round(logicalHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const canvasAspect = logicalWidth / Math.max(1, logicalHeight);
      const imageAspect = img.width / Math.max(1, img.height);
      let drawWidth = logicalWidth;
      let drawHeight = logicalHeight;
      let dx = 0;
      let dy = 0;
      if (imageAspect > canvasAspect) {
        drawWidth = logicalWidth;
        drawHeight = Math.round(drawWidth / imageAspect);
        dy = Math.round((logicalHeight - drawHeight) / 2);
      } else {
        drawHeight = logicalHeight;
        drawWidth = Math.round(drawHeight * imageAspect);
        dx = Math.round((logicalWidth - drawWidth) / 2);
      }
      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
    };

    // Expose for scroll redraw without re-binding the whole loader
    (canvas as HTMLCanvasElement & { __renderHero?: (p: number) => void }).__renderHero =
      renderFrame;

    framesRef.current = new Array(frameCount).fill(null);

    type FetchPriority = "high" | "low" | "auto";
    const loadSingleFrame = (index: number, priority: FetchPriority): Promise<void> =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.fetchPriority = priority;
        img.decoding = "async";
        img.crossOrigin = "anonymous";
        img.src = `/hero_frames/frame_${String(index + 1).padStart(3, "0")}.jpg`;
        img.onload = () => {
          if (!isMounted) return resolve();
          try {
            framesRef.current[index] = knockOutBlackBackground(img);
          } catch {
            framesRef.current[index] = img;
          }
          if (!revealedRef.current && framesRef.current[0]) {
            revealedRef.current = true;
            setIsLoaded(true);
          }
          renderFrame(smoothedRef.current);
          resolve();
        };
        img.onerror = () => resolve();
      });

    const buildProgressiveOrder = (count: number): number[] => {
      const order: number[] = [];
      const pushUnique = (i: number) => {
        if (i >= 0 && i < count && !order.includes(i)) order.push(i);
      };
      pushUnique(0);
      pushUnique(count - 1);
      let step = Math.floor(count / 2);
      while (step > 0) {
        for (let i = step; i < count - 1; i += step) pushUnique(i);
        step = Math.floor(step / 2);
      }
      for (let i = 0; i < count; i++) pushUnique(i);
      return order;
    };

    const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
    const isSlowNetwork =
      connection &&
      typeof connection.effectiveType === "string" &&
      /(^2g|3g)/i.test(connection.effectiveType);
    const maxConcurrent = isSlowNetwork ? 2 : 4;

    let cancelled = false;
    const loadImages = async () => {
      await loadSingleFrame(0, "high");
      if (!isMounted || cancelled) return;

      const order = buildProgressiveOrder(frameCount).filter((i) => i !== 0);
      let cursor = 0;
      const workers: Promise<void>[] = [];

      const launchNext = async (): Promise<void> => {
        while (cursor < order.length && isMounted && !cancelled) {
          const idx = order[cursor++]!;
          await loadSingleFrame(idx, "auto");
        }
      };

      for (let i = 0; i < maxConcurrent; i++) workers.push(launchNext());
      await Promise.all(workers);
    };

    const onResize = () => renderFrame(smoothedRef.current);
    window.addEventListener("resize", onResize, { passive: true });
    renderFrame(smoothedRef.current);
    loadImages().catch(() => {});

    return () => {
      cancelled = true;
      isMounted = false;
      window.removeEventListener("resize", onResize);
      delete (canvas as HTMLCanvasElement & { __renderHero?: unknown }).__renderHero;
    };
  }, [frameCount]);

  // Redraw when scroll progress changes
  useEffect(() => {
    const canvas = canvasRef.current as
      | (HTMLCanvasElement & { __renderHero?: (p: number) => void })
      | null;
    if (!canvas?.__renderHero) return;
    const raf = requestAnimationFrame(() => canvas.__renderHero?.(smoothedRef.current));
    return () => cancelAnimationFrame(raf);
  }, [smoothedProgress]);

  return (
    <div
      ref={ref}
      className="relative overflow-visible bg-transparent min-h-[300px] md:min-h-[60vh] lg:min-h-[80vh] xl:min-h-[100vh] 2xl:min-h-[100vh]"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full bg-transparent"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      <div
        className="absolute inset-0 bg-transparent transition-opacity duration-300"
        style={{
          opacity: isLoaded ? 0 : 1,
          zIndex: 1,
          mixBlendMode: "screen",
          pointerEvents: isLoaded ? "none" : "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
