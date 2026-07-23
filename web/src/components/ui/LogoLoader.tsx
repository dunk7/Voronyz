"use client";

import { useEffect, useState, type CSSProperties } from "react";

type LogoLoaderProps = {
  /** Visual size of the logo mark */
  size?: "sm" | "md" | "lg";
  /** Optional label under the mark */
  label?: string;
  /** Show the animated progress bar under the logo */
  showBar?: boolean;
  /** Light mark on dark overlays vs dark mark on light backgrounds */
  tone?: "dark" | "light";
  /**
   * Full stage: dots mark orbits / bounces around the “VORONYZ” wordmark.
   * Default on for md/lg loaders; overlays can set false for a compact mark.
   */
  orbit?: boolean;
  className?: string;
};

const SIZE_MAP = {
  sm: { mark: 36, bar: 88, stage: 120, text: "text-[10px]" },
  md: { mark: 48, bar: 132, stage: 168, text: "text-xs" },
  lg: { mark: 56, bar: 168, stage: 200, text: "text-sm" },
} as const;

/** Four-dot Voronyz mark that respects tone (no white-on-white PNG square). */
function VoronyzMark({
  size,
  fill,
  className = "",
  animateDots = false,
}: {
  size: number;
  fill: string;
  className?: string;
  animateDots?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle
        className={animateDots ? "logo-loader-dot logo-loader-dot--a" : undefined}
        cx="22"
        cy="18"
        r="5.5"
        fill={fill}
      />
      <circle
        className={animateDots ? "logo-loader-dot logo-loader-dot--b" : undefined}
        cx="42"
        cy="18"
        r="5.5"
        fill={fill}
      />
      <circle
        className={animateDots ? "logo-loader-dot logo-loader-dot--c" : undefined}
        cx="32"
        cy="46"
        r="5.5"
        fill={fill}
      />
      <circle
        className={animateDots ? "logo-loader-dot logo-loader-dot--core" : undefined}
        cx="32"
        cy="30"
        r="9"
        fill={fill}
      />
    </svg>
  );
}

/** Animated Voronyz logo mark with a flowing progress bar. */
export default function LogoLoader({
  size = "md",
  label,
  showBar = true,
  tone = "dark",
  orbit,
  className = "",
}: LogoLoaderProps) {
  const dims = SIZE_MAP[size];
  const fill = tone === "light" ? "#ffffff" : "#0e0e0e";
  const barTrack = tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(14,14,14,0.1)";
  const labelColor = tone === "light" ? "text-white/70" : "text-neutral-500";
  const wordmarkColor = tone === "light" ? "text-white/85" : "text-neutral-800";
  // Compact overlays stay as a simple mark; page loaders get the orbit stage.
  const useOrbit = orbit ?? size !== "sm";

  // Randomize orbit speed / direction slightly so each load feels lively.
  const [orbitVars, setOrbitVars] = useState({
    duration: 0.85,
    bounce: 0.55,
    reverse: false,
    radius: 42,
  });

  useEffect(() => {
    if (!useOrbit) return;

    const roll = () => {
      setOrbitVars({
        duration: 0.55 + Math.random() * 0.55,
        bounce: 0.35 + Math.random() * 0.45,
        reverse: Math.random() > 0.5,
        radius: 34 + Math.random() * 18,
      });
    };

    roll();
    const id = window.setInterval(roll, 900 + Math.random() * 700);
    return () => window.clearInterval(id);
  }, [useOrbit]);

  const orbitStyle = {
    "--logo-orbit-duration": `${orbitVars.duration}s`,
    "--logo-bounce-duration": `${orbitVars.bounce}s`,
    "--logo-orbit-radius": `${orbitVars.radius}px`,
  } as CSSProperties;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      {useOrbit ? (
        <div
          className="logo-loader-stage relative flex items-center justify-center"
          style={{ width: dims.stage, height: dims.stage }}
        >
          <p
            className={`logo-loader-wordmark pointer-events-none z-[1] select-none font-semibold tracking-[0.28em] uppercase ${dims.text} ${wordmarkColor}`}
          >
            Voronyz
          </p>
          <div
            className={`logo-loader-orbit absolute inset-0 ${orbitVars.reverse ? "logo-loader-orbit-reverse" : ""}`}
            style={orbitStyle}
            aria-hidden="true"
          >
            {/* Radius + bounce live on this wrapper so the mark can spin freely */}
            <div className="logo-loader-orbit-arm">
              <VoronyzMark
                size={dims.mark}
                fill={fill}
                className="logo-loader-mark-spin"
              />
            </div>
          </div>
        </div>
      ) : (
        <VoronyzMark
          size={dims.mark}
          fill={fill}
          className="logo-loader-mark"
          animateDots
        />
      )}

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

      {label ? (
        <p className={`text-xs tracking-[0.22em] uppercase ${labelColor}`}>{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

type LogoMarkProps = {
  size?: number;
  tone?: "dark" | "light";
  className?: string;
  /** Soft pulse for image placeholders */
  animate?: boolean;
};

/** Compact static/pulsing logo mark for image placeholders and overlays. */
export function LogoMark({
  size = 28,
  tone = "dark",
  className = "",
  animate = true,
}: LogoMarkProps) {
  const fill = tone === "light" ? "#ffffff" : "#0e0e0e";
  return (
    <VoronyzMark
      size={size}
      fill={fill}
      className={`${animate ? "logo-loader-mark" : ""} ${className}`}
      animateDots={animate}
    />
  );
}
