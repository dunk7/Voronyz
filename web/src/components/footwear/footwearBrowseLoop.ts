/** Three copies: peek left, real row, peek right. */
export const FOOTWEAR_BROWSE_LOOP_COPIES = 3;

/**
 * Keep native overflow scroll on the middle copy of a triplicated row.
 * Copy 0 is [0, period), copy 1 is [period, 2 * period), copy 2 starts at 2 * period.
 */
export function wrapToMiddleCopy(scrollLeft: number, period: number): number {
  if (!(period > 0) || !Number.isFinite(scrollLeft)) return scrollLeft;
  let x = scrollLeft;
  for (let i = 0; i < 8; i++) {
    if (x < period) x += period;
    else if (x >= period * 2) x -= period;
    else break;
  }
  return x;
}

/** Distance from the first card of copy 0 to the first card of copy 1. */
export function loopPeriodFromOffsets(firstOfCopy0: number, firstOfCopy1: number): number {
  const period = firstOfCopy1 - firstOfCopy0;
  return period > 0 && Number.isFinite(period) ? period : 0;
}
