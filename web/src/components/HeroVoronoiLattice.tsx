"use client";

import { useEffect, useRef } from "react";
import { Delaunay } from "d3-delaunay";
import {
  createJitteredSites,
  displacedSite,
  warpFromPointer,
  type LatticeSite,
} from "@/lib/voronoiLatticeSites";

const CELL = 58;
const POINTER_LERP = 0.18;

/** Interactive Voronoi lattice behind the homepage shoe animation only. */
export default function HeroVoronoiLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let sites: LatticeSite[] = [];
    let logicalW = 0;
    let logicalH = 0;
    let raf = 0;
    let running = true;
    const pointer = { x: 0.5, y: 0.5, live: false, sx: 0.5, sy: 0.5 };

    const layout = () => {
      const rect = parent.getBoundingClientRect();
      logicalW = Math.max(1, rect.width);
      logicalH = Math.max(1, rect.height);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const pixelW = Math.round(logicalW * dpr);
      const pixelH = Math.round(logicalH * dpr);
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }
      sites = createJitteredSites(logicalW, logicalH, CELL);
    };

    const setPointerFromEvent = (clientX: number, clientY: number) => {
      const rect = parent.getBoundingClientRect();
      const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;
      if (!inside) {
        pointer.live = false;
        return;
      }
      pointer.x = (clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = (clientY - rect.top) / Math.max(1, rect.height);
      pointer.live = true;
    };

    const onPointerMove = (event: PointerEvent) => {
      setPointerFromEvent(event.clientX, event.clientY);
    };

    const draw = (now: number) => {
      if (!running) return;
      const timeSec = now / 1000;

      pointer.sx += (pointer.x - pointer.sx) * POINTER_LERP;
      pointer.sy += (pointer.y - pointer.sy) * POINTER_LERP;

      const px = pointer.sx * logicalW;
      const py = pointer.sy * logicalH;
      const points: [number, number][] = sites.map((site) => {
        const [x, y] = displacedSite(site, timeSec, reducedMotion);
        if (reducedMotion || !pointer.live) return [x, y];
        return warpFromPointer(x, y, px, py);
      });
      if (!reducedMotion && pointer.live) {
        points.push([px, py]);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      ctx.scale(dpr, dpr);

      if (points.length < 3) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const delaunay = Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, logicalW, logicalH]);

      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      ctx.beginPath();
      delaunay.render(ctx);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.beginPath();
      voronoi.render(ctx);
      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.lineWidth = 1.15;
      ctx.stroke();

      if (pointer.live) {
        const cell = delaunay.find(pointer.sx * logicalW, pointer.sy * logicalH);
        if (cell >= 0) {
          ctx.beginPath();
          voronoi.renderCell(cell, ctx);
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.42)";
      for (const [x, y] of points) {
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    layout();
    const onResize = () => layout();
    const ro = new ResizeObserver(layout);
    ro.observe(parent);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full bg-transparent"
      aria-hidden
    />
  );
}
