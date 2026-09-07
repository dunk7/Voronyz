"use client";

import { useEffect } from "react";

const TILE_W = 50;
const TILE_H = 43;
const IDLE_MS_PER_TILE = 18_000;
const POINTER_RANGE_X = 90;
const POINTER_RANGE_Y = 70;
const SCROLL_X_RATE = 0.1;
const SCROLL_Y_RATE = 0.16;
const SCROLL_BOOST = 0.7;
const LERP = 0.18;
const BOOST_DECAY = 0.88;

function wrap(value: number, period: number) {
  return ((value % period) + period) % period;
}

/** Drives the hexagonal `.bg-texture-white` layer from pointer/touch and scroll. */
export default function HexTextureMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const root = document.documentElement;
    const pointer = { x: 0.5, y: 0.5, hasPointed: false };
    const current = { x: 0, y: 0 };
    const boost = { x: 0, y: 0 };
    let lastScrollY = window.scrollY || 0;
    let raf = 0;
    let running = true;
    const origin = performance.now();

    const setPointer = (clientX: number, clientY: number) => {
      pointer.x = clientX / Math.max(1, window.innerWidth);
      pointer.y = clientY / Math.max(1, window.innerHeight);
      pointer.hasPointed = true;
    };

    const onPointerMove = (event: PointerEvent) => {
      setPointer(event.clientX, event.clientY);
    };

    const onPointerDown = (event: PointerEvent) => {
      setPointer(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) setPointer(touch.clientX, touch.clientY);
    };

    const tick = (now: number) => {
      if (!running) return;

      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        lastScrollY = window.scrollY || 0;
        return;
      }

      const scrollY = window.scrollY || 0;
      const scrollDelta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      boost.x += scrollDelta * SCROLL_BOOST * 0.45;
      boost.y += scrollDelta * SCROLL_BOOST;
      boost.x *= BOOST_DECAY;
      boost.y *= BOOST_DECAY;

      const idleX = ((now - origin) / IDLE_MS_PER_TILE) * TILE_W;
      const pointerMul = pointer.hasPointed ? 1 : 0;

      const targetX =
        idleX +
        scrollY * SCROLL_X_RATE +
        boost.x +
        (pointer.x - 0.5) * 2 * POINTER_RANGE_X * pointerMul;
      const targetY =
        scrollY * SCROLL_Y_RATE +
        boost.y +
        (pointer.y - 0.5) * 2 * POINTER_RANGE_Y * pointerMul;

      current.x += (targetX - current.x) * LERP;
      current.y += (targetY - current.y) * LERP;

      root.style.setProperty("--hex-shift-x", `${-wrap(current.x, TILE_W)}px`);
      root.style.setProperty("--hex-shift-y", `${-wrap(current.y, TILE_H)}px`);

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("touchmove", onTouchMove);
      root.style.removeProperty("--hex-shift-x");
      root.style.removeProperty("--hex-shift-y");
    };
  }, []);

  return null;
}
