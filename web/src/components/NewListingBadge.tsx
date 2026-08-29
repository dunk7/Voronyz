type NewListingBadgeProps = {
  /**
   * Thumbnail overlay: translucent pill that slides right → left.
   * Product page chips: static translucent pill (no motion).
   */
  animated?: boolean;
  className?: string;
};

/**
 * “New Listing” chip for products still inside the new-listing window.
 * Use `animated` on grid thumbnails; omit on product detail chips.
 */
export default function NewListingBadge({
  animated = false,
  className = "",
}: NewListingBadgeProps) {
  if (animated) {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-3 z-20 h-8 overflow-hidden ${className}`.trim()}
        aria-hidden="true"
      >
        <span className="new-listing-slide-pill absolute top-0 inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-900 shadow-md ring-1 ring-black/10 backdrop-blur-md">
          New Listing
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-900 shadow-sm ring-1 ring-black/10 backdrop-blur-md ${className}`.trim()}
    >
      New Listing
    </span>
  );
}
