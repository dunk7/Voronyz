"use client";

import Image from "next/image";

type LogoLoaderProps = {
  /** Visual size of the logo mark */
  size?: "sm" | "md" | "lg";
  /**
   * Accessible status label (screen readers / aria only).
   * Not shown visually — loading UI is the pulsing logo alone.
   */
  label?: string;
  /** Show the animated progress bar under the logo (off by default) */
  showBar?: boolean;
  /** Light mark on dark overlays vs dark mark on light backgrounds */
  tone?: "dark" | "light";
  /**
   * Kept for call-site compatibility. Orbit stage was removed — loaders
   * always use the real /logo.png mark so it matches the header.
   */
  orbit?: boolean;
  className?: string;
};

const SIZE_MAP = {
  sm: { mark: 36, bar: 88 },
  md: { mark: 56, bar: 132 },
  lg: { mark: 72, bar: 168 },
} as const;

/** Site logo asset — white dots on transparent (no black square). */
const LOGO_LIGHT = "/logo.png";
/** Dark dots on transparent for light backgrounds. */
const LOGO_DARK = "/logo-dark.png";

function logoSrc(tone: "dark" | "light") {
  return tone === "light" ? LOGO_LIGHT : LOGO_DARK;
}

/** Animated Voronyz logo (same /logo.png as the header) — pulsing mark only. */
export default function LogoLoader({
  size = "md",
  label,
  showBar = false,
  tone = "dark",
  className = "",
}: LogoLoaderProps) {
  const dims = SIZE_MAP[size];
  const fill = tone === "light" ? "#ffffff" : "#0e0e0e";
  const barTrack = tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(14,14,14,0.1)";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-transparent ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
      style={{ background: "transparent" }}
    >
      {/*
        Serve the raw PNG (unoptimized) so the image pipeline never paints an
        opaque black square behind the transparent logo mark.
      */}
      <Image
        src={logoSrc(tone)}
        alt=""
        width={dims.mark}
        height={dims.mark}
        aria-hidden="true"
        unoptimized
        className="logo-loader-mark bg-transparent"
        style={{ background: "transparent", display: "block", mixBlendMode: "normal" }}
        priority
      />

      {showBar && (
        <div
          className="logo-loader-bar relative overflow-hidden rounded-full"
          style={{ width: dims.bar, height: 3, background: barTrack }}
          aria-hidden="true"
        >
          <div
            className="logo-loader-bar-fill absolute inset-y-0 left-0 rounded-full"
            style={{ background: fill }}
          />
        </div>
      )}

      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}

type LogoMarkProps = {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
  /** Soft pulse for image placeholders */
  animate?: boolean;
  priority?: boolean;
};

/** Compact site logo mark for header, placeholders, and overlays. */
export function LogoMark({
  size = 28,
  tone = "dark",
  className = "",
  animate = true,
  priority = false,
}: LogoMarkProps) {
  return (
    <Image
      src={logoSrc(tone)}
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      unoptimized
      priority={priority}
      className={`bg-transparent ${animate ? "logo-loader-mark" : ""} ${className}`}
      style={{ background: "transparent", display: "block", mixBlendMode: "normal" }}
    />
  );
}
