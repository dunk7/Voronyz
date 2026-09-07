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

function isNestedTexture(el: HTMLElement) {
  return Boolean(el.parentElement?.closest(".bg-texture-white"));
}

/** Drives the hexagonal `.bg-texture-white` layer from pointer/touch and scroll. */
export default function HexTextureMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const root = document.documentElement;
    const pointer = {
      x: 0.5,
      y: 0.5,
      clientX: 0,
      clientY: 0,
      hasPointed: false,
      inView: false,
    };
    const current = { x: 0, y: 0 };
    const boost = { x: 0, y: 0 };
    let lastScrollY = window.scrollY || 0;
    let raf = 0;
    let running = true;
    const origin = performance.now();

    const setPointer = (clientX: number, clientY: number) => {
      pointer.clientX = clientX;
      pointer.clientY = clientY;
      pointer.x = clientX / Math.max(1, window.innerWidth);
      pointer.y = clientY / Math.max(1, window.innerHeight);
      pointer.hasPointed = true;
      pointer.inView = true;
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

    const onPointerLeave = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.inView = false;
    };

    const syncLayerPointers = () => {
      const glowOn = pointer.hasPointed && pointer.inView ? "1" : "0";
      root.style.setProperty("--hex-pointer-on", glowOn);
      const layers = document.querySelectorAll(".bg-texture-white");
      for (const node of layers) {
        if (!(node instanceof HTMLElement) || isNestedTexture(node)) continue;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--hex-pointer-x", `${pointer.clientX - rect.left}px`);
        node.style.setProperty("--hex-pointer-y", `${pointer.clientY - rect.top}px`);
        node.style.setProperty("--hex-pointer-on", glowOn);
      }
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
      syncLayerPointers();

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      root.style.removeProperty("--hex-shift-x");
      root.style.removeProperty("--hex-shift-y");
      root.style.removeProperty("--hex-pointer-on");
      document.querySelectorAll(".bg-texture-white").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.removeProperty("--hex-pointer-x");
        node.style.removeProperty("--hex-pointer-y");
        node.style.removeProperty("--hex-pointer-on");
      });
    };
  }, []);

  return null;
}
