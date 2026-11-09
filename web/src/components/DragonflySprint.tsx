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
  trailRocks,
  trailSample,
  type FootPose,
} from "@/lib/dragonflySprint";

const OUTLINE_SRC = "/graphics/dragonfly-outline-v2.png";

type Point = { x: number; y: number };

type Sprite = {
  canvas: HTMLCanvasElement;
  pivot: Point;
  toeX: number;
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
      toeX: img.naturalWidth,
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
  let toeX = 0;
  for (let x = 0; x < w; x += 3) {
    for (let y = h - 1; y >= 0; y--) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 18) {
        contour.push({ x, y });
        if (x > toeX) toeX = x;
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

  return { canvas, pivot, toeX, contour };
}

/** 0 at the heel, 1 at the toe. The fold lives just ahead of the ball. */
function toeBlend(imgX: number, ballX: number, toeX: number) {
  if (imgX <= ballX) return 0;
  const t = Math.min(1, (imgX - ballX) / Math.max(1, toeX - ballX));
  const u = Math.min(1, Math.max(0, (t - 0.04) / 0.42));
  return u * u * (3 - 2 * u);
}

/** How far the bent sole hangs below the forefoot, in design pixels. */
function soleDip(sprite: Sprite, rotDeg: number, squash: number, bendDeg: number) {
  const pivx = sprite.pivot.x * SPRINT_SHOE_SCALE;
  const pivy = sprite.pivot.y * SPRINT_SHOE_SCALE * squash;
  let below = 0;
  for (const p of sprite.contour) {
    const ang = ((rotDeg + bendDeg * toeBlend(p.x, sprite.pivot.x, sprite.toeX)) * Math.PI) / 180;
    const dx = p.x * SPRINT_SHOE_SCALE - pivx;
    const dy = p.y * SPRINT_SHOE_SCALE * squash - pivy;
    const drop = dx * Math.sin(ang) + dy * Math.cos(ang);
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
  const dip = soleDip(sprite, rotDeg, foot.squash, foot.bend);
  ctx.save();
  ctx.translate(contactX, contactY - foot.y - dip);
  ctx.scale(SPRINT_SHOE_SCALE, SPRINT_SHOE_SCALE * foot.squash);
  const column = 5;
  const { width, height } = sprite.canvas;
  for (let x = 0; x < width; x += column) {
    const ang = ((rotDeg + foot.bend * toeBlend(x, sprite.pivot.x, sprite.toeX)) * Math.PI) / 180;
    ctx.save();
    ctx.translate(sprite.pivot.x, sprite.pivot.y);
    ctx.rotate(ang);
    ctx.translate(-sprite.pivot.x, -sprite.pivot.y);
    ctx.drawImage(sprite.canvas, x, 0, column + 2, height, x, 0, column + 2, height);
    ctx.restore();
  }
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

function drawRock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
) {
  const sides = 5 + Math.floor(seed * 3);
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - 0.5;
    const jag = 0.62 + (Math.sin(seed * 40 + i * 2.3) * 0.5 + 0.5) * 0.5;
    const px = x + Math.cos(a) * size * jag;
    const py = y + Math.sin(a) * size * jag * 0.7;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const shade = Math.floor(70 + seed * 55);
  ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
  ctx.fill();
  ctx.strokeStyle = `rgb(${Math.min(210, shade + 70)},${Math.min(210, shade + 70)},${Math.min(210, shade + 70)})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
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

  const rocks = trailRocks(from, to);
  for (const rock of rocks) {
    const here = trailSample(rock.dist);
    const ahead = trailSample(rock.dist + 10);
    const tx = 10 + (ahead.lateral - here.lateral);
    const ty = ahead.height - here.height;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const off = rock.side * (16 + rock.size * 0.85);
    const at = screenOf(rock.dist, bodyDist, body);
    drawRock(ctx, at.x + nx * off, at.y + ny * off + rock.size * 0.15, rock.size, rock.seed);
  }
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
    const slope = foot.y > 24 ? placed.slope * 0.35 : placed.slope;
    drawShoe(ctx, sprite, placed.x, placed.y, foot, slope);
  }
}

/**
 * Slow trail run of the wireframe Dragonfly pair.
 * The shoes flex at the toe and follow a path that hills and cuts.
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
