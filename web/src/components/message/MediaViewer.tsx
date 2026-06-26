"use client";

import { Minus, Plus, Download, Loader2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { downloadAttachment } from "@/lib/downloadAttachment";

export type MediaViewerItem = {
  url: string;
  mimeType: string;
  fileName?: string;
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Focal point in container-centered coordinates (0,0 = viewport center). */
function focalFromClient(
  clientX: number,
  clientY: number,
  container: HTMLDivElement
): Point {
  const rect = container.getBoundingClientRect();
  return {
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  };
}

function midpointFocal(
  points: Point[],
  container: HTMLDivElement
): Point {
  const cx = (points[0].x + points[1].x) / 2;
  const cy = (points[0].y + points[1].y) / 2;
  return focalFromClient(cx, cy, container);
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
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ scale: 1, translate: { x: 0, y: 0 } });
  const pointers = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ distance: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(
    null
  );
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);

  const syncTransform = useCallback((nextScale: number, nextTranslate: Point) => {
    transformRef.current = { scale: nextScale, translate: nextTranslate };
    setScale(nextScale);
    setTranslate(nextTranslate);
  }, []);

  const applyZoomAtFocal = useCallback(
    (newScale: number, focal: Point) => {
      const clamped = clamp(newScale, 1, 4);
      const { scale: prevScale, translate: prevTranslate } = transformRef.current;

      if (clamped <= 1) {
        syncTransform(1, { x: 0, y: 0 });
        return;
      }

      const ratio = clamped / prevScale;
      syncTransform(clamped, {
        x: focal.x - (focal.x - prevTranslate.x) * ratio,
        y: focal.y - (focal.y - prevTranslate.y) * ratio,
      });
    },
    [syncTransform]
  );

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
    syncTransform(1, { x: 0, y: 0 });
  }, [syncTransform]);

  const zoomBy = useCallback(
    (delta: number) => {
      const { scale: currentScale } = transformRef.current;
      applyZoomAtFocal(currentScale + delta, { x: 0, y: 0 });
    },
    [applyZoomAtFocal]
  );

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadAttachment(item.url, item.fileName ?? "download");
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (isVideo || !containerRef.current) return;
    setIsGesturing(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const { scale: currentScale, translate: currentTranslate } = transformRef.current;

    if (pointers.current.size === 1) {
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: currentTranslate.x,
        ty: currentTranslate.y,
      };
    }

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchRef.current = { distance: Math.hypot(dx, dy) };
      panStart.current = null;
    }
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (isVideo || !pointers.current.has(e.pointerId) || !containerRef.current) {
      return;
    }

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = [...pointers.current.values()];
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const distance = Math.hypot(dx, dy);
      const ratio = distance / pinchRef.current.distance;
      pinchRef.current.distance = distance;

      const focal = midpointFocal(pts, containerRef.current);
      const { scale: currentScale } = transformRef.current;
      applyZoomAtFocal(currentScale * ratio, focal);
      return;
    }

    const { scale: currentScale, translate: currentTranslate } = transformRef.current;
    if (pointers.current.size === 1 && panStart.current && currentScale > 1) {
      syncTransform(currentScale, {
        x: panStart.current.tx + (e.clientX - panStart.current.x),
        y: panStart.current.ty + (e.clientY - panStart.current.y),
      });
    }
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (isVideo || !containerRef.current) return;

    const wasDoubleTapCandidate = pointers.current.size === 1;
    const tapX = e.clientX;
    const tapY = e.clientY;

    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;

    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      const { translate: currentTranslate } = transformRef.current;
      panStart.current = {
        x: remaining.x,
        y: remaining.y,
        tx: currentTranslate.x,
        ty: currentTranslate.y,
      };
    } else {
      panStart.current = null;
    }

    if (pointers.current.size === 0) {
      setIsGesturing(false);

      if (wasDoubleTapCandidate) {
        const now = Date.now();
        const prev = lastTap.current;
        const focal = focalFromClient(tapX, tapY, containerRef.current);
        const isDoubleTap =
          prev &&
          now - prev.time < 300 &&
          Math.hypot(tapX - prev.x, tapY - prev.y) < 28;

        if (isDoubleTap) {
          const { scale: currentScale } = transformRef.current;
          if (currentScale > 1.05) resetTransform();
          else applyZoomAtFocal(2.5, focal);
          lastTap.current = null;
          return;
        }

        lastTap.current = { time: now, x: tapX, y: tapY };
      }
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
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-full p-2.5 text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            aria-label="Download"
          >
            {downloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </button>
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
              transition: isGesturing ? "none" : "transform 0.15s ease-out",
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
