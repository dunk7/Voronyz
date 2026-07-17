"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Vec = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number; color: string; label?: string; labelColor?: string };
type Collectible = { id: string; x: number; y: number; r: number; collected: boolean; color: string; emoji: string };
type Zone = { id: string; x: number; y: number; w: number; h: number; name: string; color: string; href?: string };

// Larger store floor — player stays centered while this world pans underneath.
const MAP_W = 2200;
const MAP_H = 1600;
const PLAYER_R = 16;
const SPEED = 240; // px/sec

const SHELVES: Rect[] = [
  { x: 120, y: 140, w: 200, h: 70, color: "#FF6B6B", label: "V3 Slides", labelColor: "#fff" },
  { x: 380, y: 140, w: 200, h: 70, color: "#4ECDC4", label: "Magikid", labelColor: "#0b2e2c" },
  { x: 640, y: 140, w: 200, h: 70, color: "#FFE66D", label: "Footwear", labelColor: "#5a4a00" },
  { x: 900, y: 140, w: 180, h: 70, color: "#A8E6CF", label: "New Drops", labelColor: "#1a4d3a" },
  { x: 1140, y: 140, w: 180, h: 70, color: "#54A0FF", label: "Limited", labelColor: "#fff" },
  { x: 1400, y: 140, w: 200, h: 70, color: "#FF9FF3", label: "Kids", labelColor: "#5a1a4d" },
  { x: 1680, y: 140, w: 200, h: 70, color: "#10AC84", label: "Outlet", labelColor: "#fff" },

  { x: 120, y: 320, w: 70, h: 280, color: "#FF8A5B", label: "Socks", labelColor: "#fff" },
  { x: 280, y: 320, w: 70, h: 280, color: "#2EC4B6", label: "Hoodies", labelColor: "#fff" },
  { x: 440, y: 320, w: 70, h: 280, color: "#FF9FF3", label: "Shirts", labelColor: "#5a1a4d" },
  { x: 600, y: 320, w: 70, h: 280, color: "#54A0FF", label: "Shorts", labelColor: "#fff" },
  { x: 760, y: 320, w: 70, h: 280, color: "#FF6B6B", label: "Pants", labelColor: "#fff" },
  { x: 920, y: 320, w: 80, h: 280, color: "#10AC84", label: "Gear", labelColor: "#fff" },

  { x: 1180, y: 320, w: 70, h: 280, color: "#FDCB6E", label: "Hats", labelColor: "#5a4200" },
  { x: 1340, y: 320, w: 70, h: 280, color: "#74B9FF", label: "Bags", labelColor: "#0a2a4a" },
  { x: 1500, y: 320, w: 70, h: 280, color: "#FD79A8", label: "Belts", labelColor: "#fff" },
  { x: 1660, y: 320, w: 70, h: 280, color: "#00CEC9", label: "Scarves", labelColor: "#043c3a" },
  { x: 1820, y: 320, w: 80, h: 280, color: "#A29BFE", label: "Kits", labelColor: "#fff" },

  { x: 120, y: 720, w: 260, h: 64, color: "#FD79A8", label: "Accessories", labelColor: "#fff" },
  { x: 440, y: 720, w: 240, h: 64, color: "#FDCB6E", label: "Trail Mix", labelColor: "#5a4200" },
  { x: 740, y: 720, w: 220, h: 64, color: "#74B9FF", label: "Engineering", labelColor: "#0a2a4a" },
  { x: 1020, y: 720, w: 220, h: 64, color: "#55EFC4", label: "Care Kit", labelColor: "#0a3d32" },
  { x: 1300, y: 720, w: 240, h: 64, color: "#FF7675", label: "Gift Shop", labelColor: "#fff" },
  { x: 1600, y: 720, w: 220, h: 64, color: "#81ECEC", label: "Samples", labelColor: "#0a3d3d" },

  { x: 200, y: 980, w: 180, h: 70, color: "#FAB1A0", label: "Returns", labelColor: "#5a2a1a" },
  { x: 460, y: 980, w: 200, h: 70, color: "#DFE6E9", label: "Fitting", labelColor: "#2d3436" },
  { x: 740, y: 980, w: 220, h: 70, color: "#FFEAA7", label: "Lounge", labelColor: "#5a4a00" },
  { x: 1040, y: 980, w: 200, h: 70, color: "#B2BEC3", label: "Info Desk", labelColor: "#2d3436" },
  { x: 1320, y: 980, w: 220, h: 70, color: "#A29BFE", label: "Studio", labelColor: "#fff" },
  { x: 1620, y: 980, w: 200, h: 70, color: "#55EFC4", label: "Workshop", labelColor: "#0a3d32" },

  { x: 300, y: 1240, w: 280, h: 64, color: "#FF6B6B", label: "Seasonal", labelColor: "#fff" },
  { x: 660, y: 1240, w: 280, h: 64, color: "#4ECDC4", label: "Collabs", labelColor: "#0b2e2c" },
  { x: 1020, y: 1240, w: 280, h: 64, color: "#FFE66D", label: "Clearance", labelColor: "#5a4a00" },
  { x: 1380, y: 1240, w: 280, h: 64, color: "#FF9FF3", label: "Members", labelColor: "#5a1a4d" },
];

const ZONES: Zone[] = [
  { id: "entrance", x: 980, y: 1450, w: 240, h: 80, name: "Entrance", color: "rgba(255,255,255,0.35)" },
  { id: "checkout", x: 1860, y: 720, w: 160, h: 80, name: "Checkout", color: "rgba(255, 214, 102, 0.45)", href: "/cart" },
  { id: "footwear", x: 100, y: 230, w: 1800, h: 50, name: "Footwear Wall", color: "rgba(255,255,255,0.08)" },
  { id: "apparel", x: 200, y: 420, w: 700, h: 120, name: "Apparel Aisle", color: "rgba(255,255,255,0.06)" },
  { id: "accessories", x: 1100, y: 420, w: 700, h: 120, name: "Accessories Lane", color: "rgba(255,255,255,0.06)" },
  { id: "lounge", x: 700, y: 1080, w: 300, h: 80, name: "Lounge", color: "rgba(255,234,167,0.25)" },
];

const INITIAL_COLLECTIBLES: Collectible[] = [
  { id: "c1", x: 220, y: 250, r: 12, collected: false, color: "#FFD93D", emoji: "⭐" },
  { id: "c2", x: 480, y: 250, r: 12, collected: false, color: "#FF6B9D", emoji: "👟" },
  { id: "c3", x: 760, y: 250, r: 12, collected: false, color: "#6BCB77", emoji: "⭐" },
  { id: "c4", x: 1040, y: 250, r: 12, collected: false, color: "#4D96FF", emoji: "🧢" },
  { id: "c5", x: 1320, y: 250, r: 12, collected: false, color: "#FF9F43", emoji: "⭐" },
  { id: "c6", x: 1600, y: 250, r: 12, collected: false, color: "#EE5A24", emoji: "🛍️" },
  { id: "c7", x: 190, y: 520, r: 12, collected: false, color: "#48DBFB", emoji: "⭐" },
  { id: "c8", x: 360, y: 520, r: 12, collected: false, color: "#00CEC9", emoji: "🎁" },
  { id: "c9", x: 520, y: 520, r: 12, collected: false, color: "#FD79A8", emoji: "⭐" },
  { id: "c10", x: 840, y: 520, r: 12, collected: false, color: "#55EFC4", emoji: "✨" },
  { id: "c11", x: 1260, y: 520, r: 12, collected: false, color: "#FFD93D", emoji: "⭐" },
  { id: "c12", x: 1420, y: 520, r: 12, collected: false, color: "#FF6B9D", emoji: "👟" },
  { id: "c13", x: 1740, y: 520, r: 12, collected: false, color: "#6BCB77", emoji: "⭐" },
  { id: "c14", x: 250, y: 840, r: 12, collected: false, color: "#4D96FF", emoji: "🧢" },
  { id: "c15", x: 560, y: 840, r: 12, collected: false, color: "#FF9F43", emoji: "⭐" },
  { id: "c16", x: 860, y: 840, r: 12, collected: false, color: "#EE5A24", emoji: "🛍️" },
  { id: "c17", x: 1160, y: 840, r: 12, collected: false, color: "#48DBFB", emoji: "⭐" },
  { id: "c18", x: 1460, y: 840, r: 12, collected: false, color: "#00CEC9", emoji: "🎁" },
  { id: "c19", x: 560, y: 1120, r: 12, collected: false, color: "#FD79A8", emoji: "⭐" },
  { id: "c20", x: 1100, y: 1120, r: 12, collected: false, color: "#55EFC4", emoji: "✨" },
  { id: "c21", x: 440, y: 1360, r: 12, collected: false, color: "#FFD93D", emoji: "⭐" },
  { id: "c22", x: 800, y: 1360, r: 12, collected: false, color: "#FF6B9D", emoji: "👟" },
  { id: "c23", x: 1160, y: 1360, r: 12, collected: false, color: "#6BCB77", emoji: "⭐" },
  { id: "c24", x: 1520, y: 1360, r: 12, collected: false, color: "#4D96FF", emoji: "✨" },
];

const START_POS: Vec = { x: 1100, y: 1480 };

function circleRectCollision(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function resolveCollision(pos: Vec, r: number, shelves: Rect[]): Vec {
  let { x, y } = pos;
  for (const shelf of shelves) {
    if (!circleRectCollision(x, y, r, shelf)) continue;
    const nearestX = Math.max(shelf.x, Math.min(x, shelf.x + shelf.w));
    const nearestY = Math.max(shelf.y, Math.min(y, shelf.y + shelf.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    const dist = Math.hypot(dx, dy) || 0.001;
    const overlap = r - dist + 0.5;
    if (overlap > 0) {
      if (dist < 0.5) {
        const left = Math.abs(x - shelf.x);
        const right = Math.abs(x - (shelf.x + shelf.w));
        const top = Math.abs(y - shelf.y);
        const bottom = Math.abs(y - (shelf.y + shelf.h));
        const min = Math.min(left, right, top, bottom);
        if (min === left) x = shelf.x - r;
        else if (min === right) x = shelf.x + shelf.w + r;
        else if (min === top) y = shelf.y - r;
        else y = shelf.y + shelf.h + r;
      } else {
        x += (dx / dist) * overlap;
        y += (dy / dist) * overlap;
      }
    }
  }
  x = Math.max(r + 8, Math.min(MAP_W - r - 8, x));
  y = Math.max(r + 8, Math.min(MAP_H - r - 8, y));
  return { x, y };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function isPortraitViewport() {
  if (typeof window === "undefined") return false;
  return window.innerHeight > window.innerWidth;
}

/** Top-down happy little robot — face follows movement direction. */
function drawCuteRobot(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  facing: number,
  bob: number
) {
  const r = PLAYER_R;
  const bodyY = py + bob * 0.35;

  // Soft ground shadow
  ctx.beginPath();
  ctx.ellipse(px, py + r - 1, r * 0.95, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(40, 20, 40, 0.18)";
  ctx.fill();

  ctx.save();
  ctx.translate(px, bodyY);
  ctx.rotate(facing + Math.PI / 2);

  // Side treads / little feet (top-down)
  ctx.fillStyle = "#5a6a7a";
  drawRoundedRect(ctx, -r - 3, -r * 0.55, 5, r * 1.1, 2.5);
  ctx.fill();
  drawRoundedRect(ctx, r - 2, -r * 0.55, 5, r * 1.1, 2.5);
  ctx.fill();
  // Tread notches
  ctx.fillStyle = "#3d4a56";
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(-r - 2.2, i * 4.2 - 1, 3.2, 1.6);
    ctx.fillRect(r - 1, i * 4.2 - 1, 3.2, 1.6);
  }

  // Main chassis (rounded square body)
  const bodyGrad = ctx.createLinearGradient(-r, -r, r, r);
  bodyGrad.addColorStop(0, "#E8FBFF");
  bodyGrad.addColorStop(0.45, "#7ED6DF");
  bodyGrad.addColorStop(1, "#54A0FF");
  drawRoundedRect(ctx, -r + 1, -r + 1, r * 2 - 2, r * 2 - 2, 7);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chest panel / belly plate
  drawRoundedRect(ctx, -r * 0.55, -r * 0.15, r * 1.1, r * 0.85, 5);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  // Tiny heart LED on chest
  ctx.beginPath();
  ctx.arc(-2.2, r * 0.22, 2.4, 0, Math.PI * 2);
  ctx.arc(2.2, r * 0.22, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = "#FF7675";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4.4, r * 0.28);
  ctx.lineTo(0, r * 0.55);
  ctx.lineTo(4.4, r * 0.28);
  ctx.closePath();
  ctx.fill();

  // Face plate (top half — happy robot face)
  drawRoundedRect(ctx, -r * 0.72, -r * 0.78, r * 1.44, r * 0.95, 6);
  ctx.fillStyle = "#F8FFFE";
  ctx.fill();
  ctx.strokeStyle = "rgba(84, 160, 255, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Big cute eyes
  const eyeY = -r * 0.38;
  const eyeSpread = 5.2;
  // Eye whites
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-eyeSpread, eyeY, 4.2, 4.6, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeSpread, eyeY, 4.2, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupils
  ctx.fillStyle = "#2d3436";
  ctx.beginPath();
  ctx.arc(-eyeSpread + 0.4, eyeY + 0.3, 2.4, 0, Math.PI * 2);
  ctx.arc(eyeSpread + 0.4, eyeY + 0.3, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Shine dots
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-eyeSpread - 0.8, eyeY - 1.2, 1.1, 0, Math.PI * 2);
  ctx.arc(eyeSpread - 0.8, eyeY - 1.2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Happy smile
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, 5.5, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = "#2d3436";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.stroke();

  // Cheek blush
  ctx.fillStyle = "rgba(255, 118, 117, 0.45)";
  ctx.beginPath();
  ctx.ellipse(-9.5, -r * 0.12, 2.8, 1.6, 0, 0, Math.PI * 2);
  ctx.ellipse(9.5, -r * 0.12, 2.8, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antenna stalk + bobbing tip
  ctx.strokeStyle = "#74B9FF";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -r + 2);
  ctx.lineTo(0, -r - 7 + bob * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -r - 9 + bob * 0.4, 3.2, 0, Math.PI * 2);
  const tipGrad = ctx.createRadialGradient(-1, -r - 10 + bob * 0.4, 0.5, 0, -r - 9 + bob * 0.4, 3.2);
  tipGrad.addColorStop(0, "#FFEAA7");
  tipGrad.addColorStop(1, "#FF7675");
  ctx.fillStyle = tipGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tiny side arms
  ctx.fillStyle = "#54A0FF";
  drawRoundedRect(ctx, -r - 5, -2, 5, 7, 2.5);
  ctx.fill();
  drawRoundedRect(ctx, r, -2, 5, 7, 2.5);
  ctx.fill();
  ctx.fillStyle = "#FFEAA7";
  ctx.beginPath();
  ctx.arc(-r - 2.5, 5.5, 2.6, 0, Math.PI * 2);
  ctx.arc(r + 2.5, 5.5, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export default function StoreNavGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef({ w: 900, h: 560 });
  const cameraRef = useRef<Vec>({ x: 0, y: 0 });
  const playerRef = useRef<Vec>({ ...START_POS });
  const targetRef = useRef<Vec | null>(null);
  const facingRef = useRef(0);
  const bobRef = useRef(0);
  const collectiblesRef = useRef<Collectible[]>(INITIAL_COLLECTIBLES.map((c) => ({ ...c })));
  const visitedZonesRef = useRef<Set<string>>(new Set());
  const rippleRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const popupRef = useRef<{ text: string; t: number } | null>(null);
  const activeZoneRef = useRef<string | null>(null);
  const fullscreenRef = useRef(false);
  const forceLandscapeRef = useRef(false);

  const [score, setScore] = useState(0);
  const [hint, setHint] = useState("Tap anywhere to walk your little robot around the store!");
  const [won, setWon] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [forceLandscape, setForceLandscape] = useState(false);

  const syncCamera = useCallback((player: Vec) => {
    const { w: vw, h: vh } = viewportRef.current;
    let camX = player.x - vw / 2;
    let camY = player.y - vh / 2;
    camX = Math.max(0, Math.min(Math.max(0, MAP_W - vw), camX));
    camY = Math.max(0, Math.min(Math.max(0, MAP_H - vh), camY));
    cameraRef.current = { x: camX, y: camY };
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let cssW: number;
    let cssH: number;

    if (fullscreenRef.current) {
      if (forceLandscapeRef.current && isPortraitViewport()) {
        // CSS-rotated landscape: visual width = phone height, visual height = phone width
        cssW = window.innerHeight;
        cssH = window.innerWidth;
      } else {
        cssW = window.innerWidth;
        cssH = window.innerHeight;
      }
    } else {
      const rect = wrapper.getBoundingClientRect();
      cssW = Math.max(280, Math.floor(rect.width));
      // Keep a playable landscape-ish playfield in the page layout
      cssH = Math.max(240, Math.min(Math.round(cssW * 0.62), Math.round(window.innerHeight * 0.55)));
    }

    viewportRef.current = { w: cssW, h: cssH };
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    syncCamera(playerRef.current);
  }, [syncCamera]);

  const exitFullscreen = useCallback(() => {
    fullscreenRef.current = false;
    forceLandscapeRef.current = false;
    setIsFullscreen(false);
    setForceLandscape(false);
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.height = "";
    // Defer resize so layout can settle after leaving fixed mode
    requestAnimationFrame(() => resizeCanvas());
  }, [resizeCanvas]);

  const enterFullscreen = useCallback(() => {
    const portrait = isPortraitViewport();
    fullscreenRef.current = true;
    forceLandscapeRef.current = portrait;
    setIsFullscreen(true);
    setForceLandscape(portrait);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    requestAnimationFrame(() => resizeCanvas());
  }, [resizeCanvas]);

  const toggleFullscreen = useCallback(() => {
    if (fullscreenRef.current) exitFullscreen();
    else enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  const resetGame = useCallback(() => {
    playerRef.current = { ...START_POS };
    targetRef.current = null;
    collectiblesRef.current = INITIAL_COLLECTIBLES.map((c) => ({ ...c }));
    visitedZonesRef.current = new Set();
    activeZoneRef.current = null;
    rippleRef.current = null;
    popupRef.current = { text: "Welcome to Voronyz!", t: 2.2 };
    syncCamera(START_POS);
    setScore(0);
    setWon(false);
    setActiveZone(null);
    setHint("Tap anywhere to walk your little robot around the store!");
  }, [syncCamera]);

  const screenToMap = useCallback((clientX: number, clientY: number): Vec | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    // getBoundingClientRect already reflects CSS rotation, so client coords map directly
    const localX = ((clientX - rect.left) / rect.width) * viewportRef.current.w;
    const localY = ((clientY - rect.top) / rect.height) * viewportRef.current.h;
    return {
      x: localX + cameraRef.current.x,
      y: localY + cameraRef.current.y,
    };
  }, []);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (won) return;
      const point = screenToMap(clientX, clientY);
      if (!point) return;

      let dest = { ...point };
      for (const shelf of SHELVES) {
        if (
          dest.x > shelf.x + 4 &&
          dest.x < shelf.x + shelf.w - 4 &&
          dest.y > shelf.y + 4 &&
          dest.y < shelf.y + shelf.h - 4
        ) {
          const left = Math.abs(dest.x - shelf.x);
          const right = Math.abs(dest.x - (shelf.x + shelf.w));
          const top = Math.abs(dest.y - shelf.y);
          const bottom = Math.abs(dest.y - (shelf.y + shelf.h));
          const min = Math.min(left, right, top, bottom);
          if (min === left) dest = { x: shelf.x - PLAYER_R - 2, y: dest.y };
          else if (min === right) dest = { x: shelf.x + shelf.w + PLAYER_R + 2, y: dest.y };
          else if (min === top) dest = { x: dest.x, y: shelf.y - PLAYER_R - 2 };
          else dest = { x: dest.x, y: shelf.y + shelf.h + PLAYER_R + 2 };
        }
      }
      dest.x = Math.max(PLAYER_R + 8, Math.min(MAP_W - PLAYER_R - 8, dest.x));
      dest.y = Math.max(PLAYER_R + 8, Math.min(MAP_H - PLAYER_R - 8, dest.y));

      targetRef.current = dest;
      rippleRef.current = { x: dest.x, y: dest.y, t: 0 };
      setHint("On the way…");
    },
    [screenToMap, won]
  );

  // Resize + orientation
  useEffect(() => {
    resizeCanvas();
    const onResize = () => {
      if (fullscreenRef.current) {
        const portrait = isPortraitViewport();
        forceLandscapeRef.current = portrait;
        setForceLandscape(portrait);
      }
      resizeCanvas();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      if (!fullscreenRef.current) resizeCanvas();
    }) : null;
    if (ro && wrapperRef.current) ro.observe(wrapperRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      ro?.disconnect();
    };
  }, [resizeCanvas]);

  // Escape exits fullscreen; lock page scroll while playing fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreenRef.current) {
        e.preventDefault();
        exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exitFullscreen]);

  // Prevent page scroll / rubber-band when interacting with the game canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const blockCanvasTouch = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    const blockWrapperScroll = (e: TouchEvent) => {
      // Allow taps on HUD controls; only stop scroll gestures on the playfield
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a")) return;
      if (e.cancelable) e.preventDefault();
    };
    const blockWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchstart", blockCanvasTouch, { passive: false });
    canvas.addEventListener("touchmove", blockCanvasTouch, { passive: false });
    wrapper.addEventListener("touchmove", blockWrapperScroll, { passive: false });
    wrapper.addEventListener("wheel", blockWheel, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", blockCanvasTouch);
      canvas.removeEventListener("touchmove", blockCanvasTouch);
      wrapper.removeEventListener("touchmove", blockWrapperScroll);
      wrapper.removeEventListener("wheel", blockWheel);
    };
  }, [isFullscreen]);

  // Cleanup body lock on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    syncCamera(playerRef.current);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const player = playerRef.current;
      const target = targetRef.current;
      if (target) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 3) {
          player.x = target.x;
          player.y = target.y;
          targetRef.current = null;
          setHint("Tap another spot to keep exploring!");
        } else {
          facingRef.current = Math.atan2(dy, dx);
          const step = SPEED * dt;
          const nx = player.x + (dx / dist) * Math.min(step, dist);
          const ny = player.y + (dy / dist) * Math.min(step, dist);
          const onlyX = resolveCollision({ x: nx, y: player.y }, PLAYER_R, SHELVES);
          const onlyY = resolveCollision({ x: player.x, y: ny }, PLAYER_R, SHELVES);
          const next = resolveCollision({ x: onlyX.x, y: onlyY.y }, PLAYER_R, SHELVES);
          player.x = next.x;
          player.y = next.y;
          bobRef.current += dt * 10;
        }
      } else {
        bobRef.current *= 0.9;
      }

      syncCamera(player);

      let collectedNow = 0;
      for (const c of collectiblesRef.current) {
        if (c.collected) continue;
        if (Math.hypot(c.x - player.x, c.y - player.y) < PLAYER_R + c.r) {
          c.collected = true;
          collectedNow += 1;
          popupRef.current = { text: `Got it! ${c.emoji}`, t: 1.4 };
        }
      }
      if (collectedNow > 0) {
        setScore((s) => {
          const next = s + collectedNow;
          if (next >= INITIAL_COLLECTIBLES.length) {
            setWon(true);
            setHint("You found everything in the store!");
            popupRef.current = { text: "Store explorer complete! 🎉", t: 3 };
          }
          return next;
        });
      }

      let zoneName: string | null = null;
      for (const zone of ZONES) {
        if (
          player.x > zone.x &&
          player.x < zone.x + zone.w &&
          player.y > zone.y &&
          player.y < zone.y + zone.h
        ) {
          zoneName = zone.name;
          if (!visitedZonesRef.current.has(zone.id)) {
            visitedZonesRef.current.add(zone.id);
            popupRef.current = { text: zone.name, t: 1.6 };
          }
        }
      }
      if (activeZoneRef.current !== zoneName) {
        activeZoneRef.current = zoneName;
        setActiveZone(zoneName);
      }

      if (rippleRef.current) {
        rippleRef.current.t += dt;
        if (rippleRef.current.t > 0.6) rippleRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.t -= dt;
        if (popupRef.current.t <= 0) popupRef.current = null;
      }

      const { w: vw, h: vh } = viewportRef.current;
      const cam = cameraRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      ctx.save();
      ctx.translate(-cam.x, -cam.y);

      // Floor
      const floor = ctx.createLinearGradient(0, 0, MAP_W, MAP_H);
      floor.addColorStop(0, "#FFF5EB");
      floor.addColorStop(0.45, "#FFE8F0");
      floor.addColorStop(1, "#E8F8FF");
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, MAP_W, MAP_H);

      // Checker tiles
      const tile = 48;
      const startTx = Math.floor(cam.x / tile) * tile;
      const startTy = Math.floor(cam.y / tile) * tile;
      const endTx = cam.x + vw + tile;
      const endTy = cam.y + vh + tile;
      for (let ty = startTy; ty < endTy; ty += tile) {
        for (let tx = startTx; tx < endTx; tx += tile) {
          if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
          if ((tx / tile + ty / tile) % 2 === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect(tx, ty, tile, tile);
          }
        }
      }

      // Soft vignette border
      ctx.strokeStyle = "rgba(255, 140, 120, 0.35)";
      ctx.lineWidth = 12;
      drawRoundedRect(ctx, 8, 8, MAP_W - 16, MAP_H - 16, 36);
      ctx.stroke();

      // Zones
      for (const zone of ZONES) {
        ctx.fillStyle = zone.color;
        drawRoundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(40, 30, 50, 0.45)";
        ctx.font = "600 13px ui-rounded, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, zone.x + zone.w / 2, zone.y + zone.h / 2 + 4);
      }

      // Shelves
      for (const shelf of SHELVES) {
        ctx.fillStyle = "rgba(40, 20, 40, 0.12)";
        drawRoundedRect(ctx, shelf.x + 4, shelf.y + 6, shelf.w, shelf.h, 14);
        ctx.fill();

        ctx.fillStyle = shelf.color;
        drawRoundedRect(ctx, shelf.x, shelf.y, shelf.w, shelf.h, 14);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.28)";
        drawRoundedRect(ctx, shelf.x + 6, shelf.y + 5, shelf.w - 12, 10, 6);
        ctx.fill();

        if (shelf.label) {
          ctx.fillStyle = shelf.labelColor || "#fff";
          ctx.font = "700 13px ui-rounded, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const vertical = shelf.h > shelf.w * 1.2;
          if (vertical) {
            ctx.save();
            ctx.translate(shelf.x + shelf.w / 2, shelf.y + shelf.h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(shelf.label, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(shelf.label, shelf.x + shelf.w / 2, shelf.y + shelf.h / 2);
          }
        }
      }

      // Collectibles
      for (const c of collectiblesRef.current) {
        if (c.collected) continue;
        const pulse = 1 + Math.sin(now / 220 + c.x) * 0.12;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * pulse + 4, 0, Math.PI * 2);
        ctx.fillStyle = `${c.color}55`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
        ctx.font = `${Math.round(14 * pulse)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.emoji, c.x, c.y + 1);
      }

      // Tap ripple / destination
      if (rippleRef.current) {
        const { x, y, t } = rippleRef.current;
        const alpha = Math.max(0, 1 - t / 0.6);
        ctx.beginPath();
        ctx.arc(x, y, 8 + t * 40, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 107, 107, ${alpha * 0.8})`;
        ctx.fill();
      } else if (target) {
        ctx.beginPath();
        ctx.arc(target.x, target.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 107, 107, 0.7)";
        ctx.fill();
      }

      // Cute top-down robot (camera keeps them near center)
      const bob = Math.sin(bobRef.current) * 2;
      const px = player.x;
      const py = player.y;
      drawCuteRobot(ctx, px, py, facingRef.current, bob);

      if (popupRef.current) {
        const pop = popupRef.current;
        const alpha = Math.min(1, pop.t);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = "700 18px ui-rounded, system-ui, sans-serif";
        ctx.textAlign = "center";
        const text = pop.text;
        const tw = ctx.measureText(text).width;
        const bx = px;
        const by = py + bob * 0.35 - PLAYER_R - 28;
        drawRoundedRect(ctx, bx - tw / 2 - 14, by - 16, tw + 28, 32, 16);
        ctx.fillStyle = "rgba(35, 25, 45, 0.88)";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx, by);
        ctx.restore();
      }

      // Brand corner (world-space, near map origin — also draw screen overlay below)
      ctx.fillStyle = "rgba(45, 35, 55, 0.45)";
      ctx.font = "800 16px ui-rounded, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("VORONYZ STORE", 28, 42);

      ctx.restore();

      // Mini-map (screen space)
      const mmW = 110;
      const mmH = Math.round((mmW * MAP_H) / MAP_W);
      const mmX = vw - mmW - 14;
      const mmY = 14;
      const scaleX = mmW / MAP_W;
      const scaleY = mmH / MAP_H;
      ctx.fillStyle = "rgba(35, 25, 45, 0.72)";
      drawRoundedRect(ctx, mmX - 4, mmY - 4, mmW + 8, mmH + 8, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(255,245,235,0.9)";
      ctx.fillRect(mmX, mmY, mmW, mmH);
      ctx.strokeStyle = "rgba(255,107,107,0.85)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mmX + cam.x * scaleX, mmY + cam.y * scaleY, vw * scaleX, vh * scaleY);
      // Mini-map robot blip
      const mmPx = mmX + player.x * scaleX;
      const mmPy = mmY + player.y * scaleY;
      ctx.fillStyle = "#54A0FF";
      drawRoundedRect(ctx, mmPx - 3, mmPy - 3, 6, 6, 1.5);
      ctx.fill();
      ctx.fillStyle = "#FF7675";
      ctx.beginPath();
      ctx.arc(mmPx, mmPy - 4.5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [syncCamera]);

  const hud = (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        isFullscreen ? "absolute left-0 right-0 top-0 z-20 px-3 py-2 sm:px-4" : ""
      }`}
      style={
        isFullscreen
          ? {
              background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0))",
              pointerEvents: "none",
            }
          : undefined
      }
    >
      <div className="space-y-1" style={{ pointerEvents: "auto" }}>
        <p className={`text-sm ${isFullscreen ? "text-neutral-800" : "text-neutral-600"}`}>{hint}</p>
        {activeZone && (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-rose-500">
            Now in: {activeZone}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3" style={{ pointerEvents: "auto" }}>
        <div className="rounded-full bg-gradient-to-r from-rose-400 to-amber-300 px-3 py-1.5 text-sm font-semibold text-white shadow-sm sm:px-4">
          Finds {score}/{INITIAL_COLLECTIBLES.length}
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 sm:px-4"
          aria-pressed={isFullscreen}
        >
          {isFullscreen ? "Exit" : "Full screen"}
        </button>
        <button
          type="button"
          onClick={resetGame}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 sm:px-4"
        >
          Reset
        </button>
      </div>
    </div>
  );

  const tip = (
    <p className="text-center text-xs text-neutral-500">
      Tip: you stay in the center while the big store map scrolls under you. Use Full screen on phone
      for landscape play without tilting.
    </p>
  );

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[200] bg-black"
          : "space-y-5"
      }
      style={
        isFullscreen
          ? {
              touchAction: "none",
              overscrollBehavior: "none",
            }
          : undefined
      }
    >
      {!isFullscreen && hud}

      <div
        className={isFullscreen ? "bg-[#fff5eb]" : undefined}
        style={
          isFullscreen
            ? forceLandscape
              ? {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "100vh",
                  height: "100vw",
                  transform: "translate(-50%, -50%) rotate(90deg)",
                  transformOrigin: "center center",
                  touchAction: "none",
                  overscrollBehavior: "none",
                }
              : {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  touchAction: "none",
                  overscrollBehavior: "none",
                }
            : undefined
        }
      >
        <div
          ref={wrapperRef}
          className={`relative overflow-hidden select-none touch-none overscroll-none ${
            isFullscreen
              ? "h-full w-full rounded-none ring-0 shadow-none"
              : "rounded-[28px] ring-1 ring-rose-200/60 shadow-[0_20px_60px_-28px_rgba(255,107,107,0.55)]"
          }`}
          style={{
            background:
              "radial-gradient(circle at 20% 20%, #ffe8f0, transparent 45%), radial-gradient(circle at 80% 10%, #e8f8ff, transparent 40%), #fff5eb",
            touchAction: "none",
            overscrollBehavior: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-pointer"
            style={{
              touchAction: "none",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              display: "block",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
              handlePointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0) e.preventDefault();
            }}
            role="img"
            aria-label="Top-down Voronyz store map. Tap to move your cute little robot. You stay centered while the map moves."
          />

          {isFullscreen && hud}

          {isFullscreen && forceLandscape && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium text-white">
              Landscape full screen — no need to tilt your phone
            </p>
          )}

          {won && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
              <div className="mx-4 max-w-sm rounded-3xl bg-white/95 p-6 text-center shadow-xl ring-1 ring-rose-100">
                <p className="text-2xl font-bold text-neutral-900">You explored the whole store!</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Your little robot explored it all. Tap reset for another lap, or hop over to shop for real.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={resetGame}
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Play again
                  </button>
                  <Link
                    href="/products"
                    className="rounded-full bg-gradient-to-r from-rose-400 to-amber-300 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Shop footwear
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isFullscreen && tip}
    </div>
  );
}
