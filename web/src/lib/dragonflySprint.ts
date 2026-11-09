/**
 * Ghost Dragonfly pair on a rocky trail.
 * The stride is slow enough to read. Each shoe folds at the ball of the foot
 * instead of rotating as one stiff shape. The trail climbs, drops, and cuts
 * left and right; a planted shoe stays on the same rock while the body moves on.
 */

export const SPRINT_DESIGN_W = 1440;
export const SPRINT_DESIGN_H = 820;
/** Screen Y of the runner when the trail under them is at height 0. */
export const SPRINT_GROUND_Y = 530;
/** Drawn shoe size relative to the outline artwork. */
export const SPRINT_SHOE_SCALE = 0.32;
/** Fraction of the stride a foot stays on the trail. Below half, so both feet leave the ground. */
export const SPRINT_STANCE = 0.28;
/** How far the forefoot travels along the trail during contact, in design pixels. */
export const SPRINT_STRIDE = 420;
/** Peak height of the forefoot in the air. */
export const SPRINT_LIFT = 132;
/**
 * Full strides per second. Slow on purpose — the old loop was a sprint blur.
 * One stride here lasts a little over two seconds.
 */
export const SPRINT_STRIDES_PER_SEC = 0.42;

const REACH = SPRINT_STRIDE / 2;

export type FootPose = {
  /** Forefoot position along the trail, relative to the runner. Positive is forward. */
  x: number;
  /** Forefoot height above the trail. */
  y: number;
  /** Clockwise degrees of the heel. Positive lifts the heel. */
  rot: number;
  /**
   * Extra clockwise degrees at the toe, blended from the ball forward.
   * Negative folds the toe up so the shoe bends instead of staying straight.
   */
  bend: number;
  /** Vertical scale at impact. 1 at the loop seam. */
  squash: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoother(t: number) {
  const u = clamp(t, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
}

function keyed(u: number, keys: readonly (readonly [number, number])[]) {
  let value = keys[keys.length - 1][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, r0] = keys[i];
    const [p1, r1] = keys[i + 1];
    if (u <= p1) {
      const span = p1 - p0;
      value = lerp(r0, r1, span ? smoother((u - p0) / span) : 0);
      break;
    }
  }
  return value;
}

/** Pose of one foot. `phase` is in stride cycles and wraps. */
export function footPose(phase: number): FootPose {
  const p = ((phase % 1) + 1) % 1;

  if (p < SPRINT_STANCE) {
    const u = p / SPRINT_STANCE;
    let squash = 1;
    if (u < 0.12) squash = lerp(1, 0.84, u / 0.12);
    else if (u < 0.4) squash = lerp(0.84, 1, (u - 0.12) / 0.28);
    const rot = lerp(2, 34, u ** 1.25);
    return {
      x: REACH - SPRINT_STRIDE * u,
      y: 0,
      rot,
      // Heel rises, toe stays nearer the ground: the shoe folds at the ball.
      bend: lerp(-4, -42, u ** 1.1),
      squash,
    };
  }

  const u = (p - SPRINT_STANCE) / (1 - SPRINT_STANCE);
  const whip = smoother(clamp((u - 0.08) / 0.8, 0, 1));
  const rise =
    u < 0.3
      ? Math.sin((u / 0.3) * Math.PI / 2)
      : Math.cos(clamp((u - 0.3) / 0.7, 0, 1) * Math.PI / 2);

  return {
    x: REACH - SPRINT_STRIDE + SPRINT_STRIDE * whip,
    y: SPRINT_LIFT * rise,
    rot: keyed(u, [
      [0, 34],
      [0.22, 14],
      [0.46, -2],
      [0.7, -16],
      [0.88, -4],
      [1, 2],
    ]),
    bend: keyed(u, [
      [0, -42],
      [0.28, -22],
      [0.62, -16],
      [0.84, -8],
      [1, -4],
    ]),
    squash: 1,
  };
}

/** Design pixels per second the trail scrolls so a planted shoe does not skate. */
export function pathSpeed() {
  return (SPRINT_STRIDE / SPRINT_STANCE) * SPRINT_STRIDES_PER_SEC;
}

export type TrailSample = {
  /** Pixels added to screen Y. Positive is downhill. */
  height: number;
  /** Pixels added to screen X. Positive cuts right. */
  lateral: number;
  /** Trail angle in radians, clockwise when the path drops to the right. */
  slope: number;
};

/** Hills plus left/right cuts. Derivatives match the sines so the slope is the hill grade. */
export function trailSample(distance: number): TrailSample {
  const height =
    Math.sin(distance * 0.0031) * 58 +
    Math.sin(distance * 0.0084 + 0.6) * 20;
  const lateral =
    Math.sin(distance * 0.00205) * 156 +
    Math.sin(distance * 0.0057 + 1.3) * 58;
  const dh =
    Math.cos(distance * 0.0031) * 58 * 0.0031 +
    Math.cos(distance * 0.0084 + 0.6) * 20 * 0.0084;
  return {
    height,
    lateral,
    slope: Math.atan2(dh, 1),
  };
}

export type TrailRock = {
  dist: number;
  /** -1 to 1, across the trail. Near 0 sits on the path they run. */
  side: number;
  size: number;
  seed: number;
};

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Rocks along a stretch of trail. Same distance always returns the same stones. */
export function trailRocks(from: number, to: number): TrailRock[] {
  const rocks: TrailRock[] = [];
  const start = Math.floor(from / 96) - 1;
  const end = Math.ceil(to / 96) + 1;
  for (let i = start; i <= end; i++) {
    const seed = hash(i + 2);
    const dist = i * 96 + hash(i + 11) * 42;
    if (dist < from || dist > to) continue;
    const onPath = hash(i + 5) > 0.62;
    const side = onPath ? (hash(i + 19) - 0.5) * 0.35 : (hash(i + 19) - 0.5) * 2;
    const boulder = hash(i + 8) < 0.18;
    rocks.push({
      dist,
      side,
      size: (boulder ? 22 : 8) + seed * (boulder ? 20 : 14),
      seed,
    });
  }
  return rocks;
}
