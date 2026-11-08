import Link from "next/link";

const linkClass =
  "text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-sm";

const sepClass = "text-neutral-300 select-none";

/**
 * Quiet cross-links at the bottom of the homepage — not in the hamburger menu.
 */
export default function HomeSecondaryLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="More on Voronyz"
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-4 sm:pb-6 ${className}`}
    >
      <Link href="/health" className={linkClass}>
        Collaborative
      </Link>
      <span className={sepClass}>·</span>
      <Link href="/about" className={linkClass}>
        About
      </Link>
      <span className={sepClass}>·</span>
      <Link href="/apparel/accessories" className={linkClass}>
        Accessories
      </Link>
      <span className={sepClass}>·</span>
      <Link href="/affiliates" className={linkClass}>
        Affiliates
      </Link>
    </nav>
  );
}
