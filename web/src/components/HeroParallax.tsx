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

  // Preload image sequence and render on canvas (eliminates video seek flicker)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = ref.current;
    if (!canvas || !container) return;

    let isMounted = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to container size and keep aspect ratio
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));
      // Re-render current frame on resize
      renderFrame(smoothedRef.current);
    };

    const loadImages = async () => {
      const frames: HTMLImageElement[] = [];
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'eager';
        // Prefer alpha-enabled PNG frames if present
        img.src = `/hero_frames/frame_${String(i).padStart(3, '0')}.png`;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load frame ' + i));
        });
        frames.push(img);
      }
      if (!isMounted) return;
      imagesRef.current = frames;
      setIsLoaded(true);
      // Render the first frame immediately
      renderFrame(smoothedRef.current);
    };

    const renderFrame = (progress: number) => {
      if (!ctx || imagesRef.current.length === 0) return;
      const total = imagesRef.current.length;
      const idx = progress >= 0.999 ? total - 1 : Math.floor(progress * (total - 1));
      const frameIndex = Math.max(0, Math.min(total - 1, idx));
      const img = imagesRef.current[frameIndex];

      // Clear and draw with contain behavior (letterbox/pillarbox)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const canvasAspect = canvas.width / canvas.height;
      const imageAspect = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let dx = 0;
      let dy = 0;
      if (imageAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = canvas.width;
        drawHeight = Math.round(drawWidth / imageAspect);
        dy = Math.round((canvas.height - drawHeight) / 2);
      } else {
        // Image is taller than canvas
        drawHeight = canvas.height;
        drawWidth = Math.round(drawHeight * imageAspect);
        dx = Math.round((canvas.width - drawWidth) / 2);
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
    const draw = () => {
      const progress = smoothedRef.current;
      const total = imagesRef.current.length;
      const idx = progress >= 0.999 ? total - 1 : Math.floor(progress * (total - 1));
      const frameIndex = Math.max(0, Math.min(total - 1, idx));
      const img = imagesRef.current[frameIndex];
      const container = ref.current!;
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width));
      canvas.height = Math.max(1, Math.floor(height));

      const canvasAspect = canvas.width / canvas.height;
      const imageAspect = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let dx = 0;
      let dy = 0;
      if (imageAspect > canvasAspect) {
        drawWidth = canvas.width;
        drawHeight = Math.round(drawWidth / imageAspect);
        dy = Math.round((canvas.height - drawHeight) / 2);
      } else {
        drawHeight = canvas.height;
        drawWidth = Math.round(drawHeight * imageAspect);
        dx = Math.round((canvas.width - drawWidth) / 2);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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


