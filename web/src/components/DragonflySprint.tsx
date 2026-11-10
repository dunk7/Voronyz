"use client";

import { useEffect, useRef } from "react";
import {
  SPRINT_DESIGN_H,
  SPRINT_DESIGN_W,
  SPRINT_GROUND_Y,
  SPRINT_SHOE_SCALE,
  SPRINT_STRIDES_PER_SEC,
  SPRINT_TRAIL_TOP,
  footPose,
  pathSpeed,
  trailSample,
  type FootPose,
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
    return {
      canvas,
      pivot: { x: img.naturalWidth / 2, y: img.naturalHeight },
      contour: [],
    };
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
  for (let x = 0; x < w; x += 2) {
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

/** How far the sole hangs below the pivot after rotation, in design pixels. */
function soleDip(sprite: Sprite, rotDeg: number, squash: number) {
  const pivx = sprite.pivot.x * SPRINT_SHOE_SCALE;
  const pivy = sprite.pivot.y * SPRINT_SHOE_SCALE * squash;
  const ang = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  let below = 0;
  for (const p of sprite.contour) {
    const dx = p.x * SPRINT_SHOE_SCALE - pivx;
    const dy = p.y * SPRINT_SHOE_SCALE * squash - pivy;
    const drop = dx * sin + dy * cos;
    if (drop > below) below = drop;
  }
  return below;
}

function drawShoe(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  contactX: number,
  contactY: number,
  foot: FootPose,
  slopeRad: number,
) {
  const rotDeg = foot.rot + (slopeRad * 180) / Math.PI;
  const lift = Math.max(0, foot.y);
  // Contact sits on the top of the trail stroke, never through it.
  const groundY = contactY - SPRINT_TRAIL_TOP;
  // Only plant-correct while on the trail. In the air, skip so the toe
  // does not get levered upward to keep a rear sole pixel from sinking.
  const dip = lift < 4 ? soleDip(sprite, rotDeg, foot.squash) : 0;
  ctx.save();
  // Pivot lands on the contact point, then the shoe rotates around it.
  ctx.translate(contactX, groundY - lift - dip);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(SPRINT_SHOE_SCALE, SPRINT_SHOE_SCALE * foot.squash);
  ctx.translate(-sprite.pivot.x, -sprite.pivot.y);
  ctx.drawImage(sprite.canvas, 0, 0);
  ctx.restore();
}

/** Follow the runner partway, so the trail still climbs and cuts across the frame. */
const TRAIL_FOLLOW = 0.5;

function screenPoint(dist: number, bodyDist: number, body: { height: number; lateral: number }) {
  const sample = trailSample(dist);
  return {
    x: SPRINT_DESIGN_W * 0.5 + (dist - bodyDist) + sample.lateral - body.lateral * TRAIL_FOLLOW,
    y: SPRINT_GROUND_Y + sample.height - body.height * TRAIL_FOLLOW,
  };
}

function screenOf(dist: number, bodyDist: number, body: { height: number; lateral: number }) {
  const here = screenPoint(dist, bodyDist, body);
  const ahead = screenPoint(dist + 28, bodyDist, body);
  return {
    ...here,
    slope: Math.atan2(ahead.y - here.y, ahead.x - here.x),
  };
}

function drawTrail(ctx: CanvasRenderingContext2D, bodyDist: number) {
  const body = trailSample(bodyDist);
  const from = bodyDist - 980;
  const to = bodyDist + 1100;
  const points: { x: number; y: number }[] = [];
  for (let dist = from; dist <= to; dist += 18) {
    const p = screenOf(dist, bodyDist, body);
    points.push(p);
  }
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y + 18);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y + 18);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 46;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.strokeStyle = "#4a4a4a";
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.strokeStyle = "#c8c8c8";
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function paint(ctx: CanvasRenderingContext2D, sprite: Sprite, elapsedSec: number) {
  const phase = elapsedSec * SPRINT_STRIDES_PER_SEC;
  const bodyDist = elapsedSec * pathSpeed();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SPRINT_DESIGN_W, SPRINT_DESIGN_H);
  drawTrail(ctx, bodyDist);

  const body = trailSample(bodyDist);
  const feet = [footPose(phase), footPose(phase + 0.5)].sort((a, b) => b.y - a.y || a.x - b.x);
  for (const foot of feet) {
    const placed = screenOf(bodyDist + foot.x, bodyDist, body);
    // Follow the hill gently — full slope tips the silhouette into the trail.
    const slope = foot.y > 18 ? placed.slope * 0.15 : placed.slope * 0.4;
    drawShoe(ctx, sprite, placed.x, placed.y, foot, slope);
  }
}

/**
 * Athletic trail run of the wireframe Dragonfly pair.
 * Rigid shoes follow a curvy hilled path — no rocks, no bent toes.
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
      const elapsed = reduce.matches ? 0.28 / SPRINT_STRIDES_PER_SEC : (now - startedAt) / 1000;
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
      if (reduce.matches) paint(ctx, sprite, 0.28 / SPRINT_STRIDES_PER_SEC);
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
