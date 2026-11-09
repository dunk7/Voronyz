"use client";

import { useEffect, useRef } from "react";
import {
  SPRINT_DESIGN_H,
  SPRINT_DESIGN_W,
  SPRINT_GROUND_Y,
  SPRINT_SHOE_SCALE,
  SPRINT_STRIDES_PER_SEC,
  footPose,
  pathSpeed,
} from "@/lib/dragonflySprint";

const OUTLINE_SRC = "/graphics/dragonfly-outline-v2.png";

type Point = { x: number; y: number };

type Sprite = {
  canvas: HTMLCanvasElement;
  pivot: Point;
  contour: Point[];
};

function prepareSprite(img: HTMLImageElement): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { canvas, pivot: { x: img.naturalWidth / 2, y: img.naturalHeight }, contour: [] };
  }
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.max(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = lum < 8 ? 0 : Math.min(255, Math.round(lum * 1.12));
  }
  ctx.putImageData(image, 0, 0);

  const contour: Point[] = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let x = 0; x < w; x += 3) {
    for (let y = h - 1; y >= 0; y--) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 18) {
        contour.push({ x, y });
        break;
      }
    }
  }

  let sole = 0;
  for (const p of contour) if (p.y > sole) sole = p.y;
  let pivot = contour[0] ?? { x: w / 2, y: h - 1 };
  for (const p of contour) {
    if (p.y >= sole - 6 && p.x > pivot.x) pivot = p;
  }

  return { canvas, pivot, contour };
}

/** How far the sole hangs below the forefoot pivot, in design pixels. */
function soleDip(sprite: Sprite, rotDeg: number, squash: number) {
  const ang = (rotDeg * Math.PI) / 180;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const pivx = sprite.pivot.x * SPRINT_SHOE_SCALE;
  const pivy = sprite.pivot.y * SPRINT_SHOE_SCALE * squash;
  let below = 0;
  for (const p of sprite.contour) {
    const dx = p.x * SPRINT_SHOE_SCALE - pivx;
    const dy = p.y * SPRINT_SHOE_SCALE * squash - pivy;
    const drop = dx * s + dy * c;
    if (drop > below) below = drop;
  }
  return below;
}

function drawShoe(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  contactX: number,
  lift: number,
  rotDeg: number,
  squash: number,
) {
  const dip = soleDip(sprite, rotDeg, squash);
  ctx.save();
  ctx.translate(contactX, SPRINT_GROUND_Y - lift - dip);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(SPRINT_SHOE_SCALE, SPRINT_SHOE_SCALE * squash);
  ctx.translate(-sprite.pivot.x, -sprite.pivot.y);
  ctx.drawImage(sprite.canvas, 0, 0);
  ctx.restore();
}

function drawPath(ctx: CanvasRenderingContext2D, scroll: number) {
  const y = SPRINT_GROUND_Y;
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, y, SPRINT_DESIGN_W, SPRINT_DESIGN_H - y);

  ctx.strokeStyle = "#e6e6e6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y + 1.5);
  ctx.lineTo(SPRINT_DESIGN_W, y + 1.5);
  ctx.stroke();

  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y + 92);
  ctx.lineTo(SPRINT_DESIGN_W, y + 92);
  ctx.stroke();

  const period = 228;
  const shift = ((scroll % period) + period) % period;
  ctx.fillStyle = "#b5b5b5";
  ctx.strokeStyle = "#7a7a7a";
  ctx.lineWidth = 2;
  for (let x = -shift; x < SPRINT_DESIGN_W + period; x += period) {
    const mark = Math.round(x);
    ctx.fillRect(mark, y + 40, 104, 6);
    ctx.beginPath();
    ctx.moveTo(mark + 28, y + 10);
    ctx.lineTo(mark + 28, y + 24);
    ctx.stroke();
  }
}

function paint(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  elapsedSec: number,
) {
  const phase = elapsedSec * SPRINT_STRIDES_PER_SEC;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SPRINT_DESIGN_W, SPRINT_DESIGN_H);
  drawPath(ctx, elapsedSec * pathSpeed());

  const runner = SPRINT_DESIGN_W * 0.58;
  const feet = [footPose(phase), footPose(phase + 0.5)].sort((a, b) => b.y - a.y || a.x - b.x);
  for (const foot of feet) {
    drawShoe(ctx, sprite, runner + foot.x, foot.y, foot.rot, foot.squash);
  }
}

/**
 * Live sprint of the wireframe Dragonfly pair along a lane.
 * Replaces the short rocking GIF, which read as a loading spinner.
 */
export default function DragonflySprint() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let sprite: Sprite | null = null;
    let visible = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const startedAt = performance.now();

    const fit = () => {
      const cssW = canvas.clientWidth || SPRINT_DESIGN_W;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssH = (cssW * SPRINT_DESIGN_H) / SPRINT_DESIGN_W;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform((dpr * cssW) / SPRINT_DESIGN_W, 0, 0, (dpr * cssH) / SPRINT_DESIGN_H, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const frame = (now: number) => {
      if (!sprite) return;
      const elapsed = reduce.matches ? 0.2 / SPRINT_STRIDES_PER_SEC : (now - startedAt) / 1000;
      paint(ctx, sprite, elapsed);
      if (!reduce.matches && visible) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (!sprite) return;
      fit();
      raf = requestAnimationFrame(frame);
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      sprite = prepareSprite(img);
      if (visible) start();
    };
    img.src = OUTLINE_SRC;

    const onResize = () => {
      if (!sprite) return;
      fit();
      if (reduce.matches) paint(ctx, sprite, 0.2 / SPRINT_STRIDES_PER_SEC);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else cancelAnimationFrame(raf);
      },
      { threshold: 0.15 },
    );
    intersection.observe(canvas);

    const onMotion = () => start();
    reduce.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      reduce.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="block h-auto w-full bg-black"
      style={{ aspectRatio: `${SPRINT_DESIGN_W} / ${SPRINT_DESIGN_H}` }}
      aria-hidden
    />
  );
}
