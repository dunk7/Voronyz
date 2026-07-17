"use client";

type LogoLoaderProps = {
  /** Visual size of the logo mark */
  size?: "sm" | "md" | "lg";
  /** Optional label under the mark */
  label?: string;
  /** Show the animated progress bar under the logo */
  showBar?: boolean;
  /** Light mark on dark overlays vs dark mark on light backgrounds */
  tone?: "dark" | "light";
  className?: string;
};

const SIZE_MAP = {
  sm: { mark: 36, bar: 88 },
  md: { mark: 56, bar: 132 },
  lg: { mark: 72, bar: 168 },
} as const;

/** Animated Voronyz mark: center dot + three surrounding dots, with a flowing progress bar. */
export default function LogoLoader({
  size = "md",
  label,
  showBar = true,
  tone = "dark",
  className = "",
}: LogoLoaderProps) {
  const dims = SIZE_MAP[size];
  const fill = tone === "light" ? "#ffffff" : "#0e0e0e";
  const barTrack = tone === "light" ? "rgba(255,255,255,0.18)" : "rgba(14,14,14,0.1)";
  const labelColor = tone === "light" ? "text-white/70" : "text-neutral-500";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <svg
        width={dims.mark}
        height={dims.mark}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="logo-loader-mark"
      >
        {/* Outer dots — triangular / Y arrangement around the core */}
        <circle className="logo-loader-dot logo-loader-dot--a" cx="22" cy="18" r="5.5" fill={fill} />
        <circle className="logo-loader-dot logo-loader-dot--b" cx="42" cy="18" r="5.5" fill={fill} />
        <circle className="logo-loader-dot logo-loader-dot--c" cx="32" cy="46" r="5.5" fill={fill} />
        {/* Center dot */}
        <circle className="logo-loader-dot logo-loader-dot--core" cx="32" cy="30" r="9" fill={fill} />
      </svg>

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
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${animate ? "logo-loader-mark" : ""} ${className}`}
    >
      <circle className={animate ? "logo-loader-dot logo-loader-dot--a" : undefined} cx="22" cy="18" r="5.5" fill={fill} />
      <circle className={animate ? "logo-loader-dot logo-loader-dot--b" : undefined} cx="42" cy="18" r="5.5" fill={fill} />
      <circle className={animate ? "logo-loader-dot logo-loader-dot--c" : undefined} cx="32" cy="46" r="5.5" fill={fill} />
      <circle className={animate ? "logo-loader-dot logo-loader-dot--core" : undefined} cx="32" cy="30" r="9" fill={fill} />
    </svg>
  );
}
