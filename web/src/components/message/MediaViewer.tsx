"use client";

import { Minus, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type MediaViewerItem = {
  url: string;
  mimeType: string;
  fileName?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MediaViewer({
  item,
  onClose,
}: {
  item: MediaViewerItem;
  onClose: () => void;
}) {
  const isVideo = item.mimeType.startsWith("video/");
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );
  const lastTap = useRef(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => clamp(Number((s + delta).toFixed(2)), 1, 4));
    if (scale + delta <= 1) setTranslate({ x: 0, y: 0 });
  }, [scale]);

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (isVideo) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    }

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchStart.current = {
        distance: Math.hypot(dx, dy),
        scale,
      };
      panStart.current = null;
    }
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (isVideo || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const distance = Math.hypot(dx, dy);
      const ratio = distance / pinchStart.current.distance;
      setScale(clamp(pinchStart.current.scale * ratio, 1, 4));
      return;
    }

    if (pointers.current.size === 1 && panStart.current && scale > 1) {
      setTranslate({
        x: panStart.current.tx + (e.clientX - panStart.current.x),
        y: panStart.current.ty + (e.clientY - panStart.current.y),
      });
    }
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;

    if (!isVideo && pointers.current.size === 0) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale > 1) resetTransform();
        else setScale(2);
      }
      lastTap.current = now;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex touch-none flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="Media preview"
    >
      <div className="flex items-center justify-between px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="truncate px-2 text-sm text-white/70">
          {item.fileName ?? (isVideo ? "Video" : "Photo")}
        </p>
        <div className="flex items-center gap-1">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={() => zoomBy(-0.5)}
                className="rounded-full p-2.5 text-white/80 transition hover:bg-white/10"
                aria-label="Zoom out"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => zoomBy(0.5)}
                className="rounded-full p-2.5 text-white/80 transition hover:bg-white/10"
                aria-label="Zoom in"
              >
                <Plus className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2.5 text-white/80 transition hover:bg-white/10"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={item.url}
            controls
            playsInline
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 5rem)" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.fileName ?? ""}
            draggable={false}
            className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl will-change-transform"
            style={{
              maxHeight: "calc(100dvh - 5rem)",
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transition:
                pointers.current.size > 0 ? "none" : "transform 0.15s ease-out",
            }}
          />
        )}
      </div>

      {!isVideo && (
        <p className="pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs text-white/40">
          Pinch or double-tap to zoom · Drag to pan
        </p>
      )}
    </div>
  );
}
