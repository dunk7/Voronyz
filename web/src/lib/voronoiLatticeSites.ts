export type LatticeSite = {
  x: number;
  y: number;
  phase: number;
  ampX: number;
  ampY: number;
  speed: number;
};

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Jittered-grid seed points for a Voronoi lattice (irregular polygonal cells,
 * not a hex honeycomb).
 */
export function createJitteredSites(
  width: number,
  height: number,
  cellSize: number,
  rng: () => number = mulberry32(0x5e1d)
): LatticeSite[] {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const cell = Math.max(24, cellSize);
  const cols = Math.max(3, Math.ceil(w / cell) + 2);
  const rows = Math.max(3, Math.ceil(h / cell) + 2);
  const sites: LatticeSite[] = [];

  for (let row = -1; row < rows; row += 1) {
    for (let col = -1; col < cols; col += 1) {
      const jitterX = (rng() - 0.5) * cell * 0.78;
      const jitterY = (rng() - 0.5) * cell * 0.78;
      sites.push({
        x: col * cell + cell * 0.5 + jitterX,
        y: row * cell + cell * 0.5 + jitterY,
        phase: rng() * Math.PI * 2,
        ampX: 3 + rng() * 6,
        ampY: 3 + rng() * 6,
        speed: 0.35 + rng() * 0.55,
      });
    }
  }

  return sites;
}

export function displacedSite(
  site: LatticeSite,
  timeSec: number,
  reducedMotion: boolean
): [number, number] {
  if (reducedMotion) return [site.x, site.y];
  return [
    site.x + Math.sin(timeSec * site.speed + site.phase) * site.ampX,
    site.y + Math.cos(timeSec * site.speed * 0.86 + site.phase) * site.ampY,
  ];
}
