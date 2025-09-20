"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const [smoothedProgress, setSmoothedProgress] = useState(0);
  const smoothedRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [frameCount] = useState(20);
  const [, setIsFullyLoaded] = useState(false);
  type FetchPriority = 'high' | 'low' | 'auto';

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Check for mobile device
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mobileQuery.matches);

    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      if (e.media === '(prefers-reduced-motion: reduce)') {
        setPrefersReducedMotion(e.matches);
      }
    };

    const handleMobileChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaQueryChange);
    mobileQuery.addEventListener('change', handleMobileChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Intersection Observer for visibility detection (kept lightweight)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsVisible(entry.isIntersecting);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50% 0px' });

    observer.observe(el);

    // Throttled scroll handler for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const lastY = lastScrollYRef.current;
          const scrollingUp = y < lastY;
          const rect = el.getBoundingClientRect();
          const elementHeight = rect.height || 1;
          const windowHeight = window.innerHeight;

          // Uniform-speed mapping across the hero's own height
          // Progress = 0 when page scroll is before hero's top, 1 after its bottom
          const elementTop = el.offsetTop;
          const baseProgress = (y - elementTop) / elementHeight;
          const rawProgress = Math.max(0, Math.min(1, baseProgress));

          // No smoothing to avoid perceived speed changes and snapping
          smoothedRef.current = rawProgress;
          setSmoothedProgress(rawProgress);

          ticking = false;
          lastScrollYRef.current = y;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Prime initial progress using same uniform mapping
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const elementTop = el.offsetTop;
      const elementHeight = el.offsetHeight || 1;
      const baseProgress = (y - elementTop) / elementHeight;
      const rawProgress = Math.max(0, Math.min(1, baseProgress));
      smoothedRef.current = rawProgress;
      setSmoothedProgress(rawProgress);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Preload image sequence progressively and render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = ref.current;
    if (!canvas || !container) return;

    let isMounted = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to container size (scaled by devicePixelRatio) and keep aspect ratio
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      // Reset then scale to map logical CSS pixels to device pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      // Re-render current frame on resize
      renderFrame(smoothedRef.current);
    };

    // Maintain an array of frames that may be null until loaded
    imagesRef.current = new Array(frameCount).fill(null) as unknown as HTMLImageElement[];

    const loadSingleFrame = (index: number, priority: FetchPriority): Promise<void> => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        (img as any).fetchPriority = priority;
        img.decoding = 'async';
        img.src = `/hero_frames/frame_${String(index + 1).padStart(3, '0')}.png`;
        img.onload = () => {
          if (!isMounted) return resolve();
          imagesRef.current[index] = img;
          // If this is the very first frame we loaded, reveal canvas
          if (!isLoaded && imagesRef.current[0]) {
            setIsLoaded(true);
            renderFrame(smoothedRef.current);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    /**
     * Build a progressive load order that quickly covers the whole timeline,
     * then fills remaining gaps. Example for 20: 0, 19, 9, 4, 14, 2, 6, 12, 16, 1, 3, 5, ...
     */
    const buildProgressiveOrder = (count: number): number[] => {
      const order: number[] = [];
      const pushUnique = (i: number) => { if (i >= 0 && i < count && !order.includes(i)) order.push(i); };
      // Seed with first and last for instant coverage
      pushUnique(0);
      pushUnique(count - 1);
      // Then binary-split sampling
      let step = Math.floor(count / 2);
      while (step > 0) {
        for (let i = step; i < count - 1; i += step) pushUnique(i);
        step = Math.floor(step / 2);
      }
      // Finally ensure all indices are there
      for (let i = 0; i < count; i++) pushUnique(i);
      return order;
    };

    const connection = (navigator as any).connection as { effectiveType?: string } | undefined;
    const isSlowNetwork = connection && typeof connection.effectiveType === 'string' && /(^2g|3g)/i.test(connection.effectiveType);
    const maxConcurrent = isSlowNetwork ? 2 : 4;

    const loadImages = async () => {
      // Load first frame immediately (high priority)
      await loadSingleFrame(0, 'high');
      if (!isMounted) return;

      // Start progressive loading in background with limited concurrency
      const order = buildProgressiveOrder(frameCount).filter(i => i !== 0);
      let cursor = 0;
      const inFlight: Promise<void>[] = [];

      const launchNext = () => {
        if (cursor >= order.length) return;
        const idx = order[cursor++];
        const p = loadSingleFrame(idx, 'auto').then(() => {
          // After each frame, try to render the current progress frame
          renderFrame(smoothedRef.current);
          launchNext();
        });
        inFlight.push(p);
      };

      // Prime the pool
      for (let i = 0; i < maxConcurrent; i++) launchNext();
      await Promise.all(inFlight);
      if (!isMounted) return;
      setIsFullyLoaded(true);
    };

    const findNearestLoadedIndex = (targetIndex: number): number | null => {
      if (imagesRef.current[targetIndex]) return targetIndex;
      // Search outwards for nearest loaded
      for (let offset = 1; offset < frameCount; offset++) {
        const left = targetIndex - offset;
        const right = targetIndex + offset;
        if (left >= 0 && imagesRef.current[left]) return left;
        if (right < frameCount && imagesRef.current[right]) return right;
      }
      return null;
    };

    const renderFrame = (progress: number) => {
      if (!ctx) return;
      const total = frameCount;
      const idx = progress >= 0.999 ? total - 1 : Math.floor(progress * (total - 1));
      const frameIndex = Math.max(0, Math.min(total - 1, idx));
      const nearest = findNearestLoadedIndex(frameIndex);
      if (nearest === null) return;
      const img = imagesRef.current[nearest]!;

      // Determine logical (CSS pixel) canvas size from container
      const { width: logicalWidth, height: logicalHeight } = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const targetWidth = Math.max(1, Math.round(logicalWidth * dpr));
      const targetHeight = Math.max(1, Math.round(logicalHeight * dpr));

      // Ensure backing store matches current size
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      // Clear in device pixels (reset transform to avoid partial clear), then restore scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Compute draw rect in logical pixels and draw
      const canvasAspect = logicalWidth / logicalHeight;
      const imageAspect = img.width / img.height;
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

    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });
    resize();
    loadImages().catch(() => setHasError(true));

    return () => {
      isMounted = false;
      window.removeEventListener('resize', onResize);
    };
  }, [frameCount]);

  // Re-render canvas when progress changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || imagesRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use requestAnimationFrame to coalesce rapid updates
    let raf = 0;
    const findNearestLoadedIndex = (targetIndex: number): number | null => {
      if (imagesRef.current[targetIndex]) return targetIndex;
      for (let offset = 1; offset < frameCount; offset++) {
        const left = targetIndex - offset;
        const right = targetIndex + offset;
        if (left >= 0 && imagesRef.current[left]) return left;
        if (right < frameCount && imagesRef.current[right]) return right;
      }
      return null;
    };

    const draw = () => {
      const progress = smoothedRef.current;
      const total = frameCount;
      const idx = progress >= 0.999 ? total - 1 : Math.floor(progress * (total - 1));
      const frameIndex = Math.max(0, Math.min(total - 1, idx));
      const nearest = findNearestLoadedIndex(frameIndex);
      if (nearest === null) return;
      const img = imagesRef.current[nearest]!;
      const container = ref.current!;

      const { width: logicalWidth, height: logicalHeight } = container.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const targetWidth = Math.max(1, Math.round(logicalWidth * dpr));
      const targetHeight = Math.max(1, Math.round(logicalHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      // Clear full buffer then draw in logical pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const canvasAspect = logicalWidth / logicalHeight;
      const imageAspect = img.width / img.height;
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

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [smoothedProgress]);

  return (
    <div ref={ref} className="will-change-transform relative overflow-hidden rounded-2xl min-h-[300px] md:min-h-[60vh] lg:min-h-[80vh] xl:min-h-[100vh] 2xl:min-h-[100vh]">
      {/* Canvas-based image sequence (no flicker) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: isLoaded ? 'block' : 'none' }} />

      {/* Fallback content */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isLoaded ? 0 : 1,
          zIndex: 1
        }}
      >
        {children}
      </div>

      
    </div>
  );
}


