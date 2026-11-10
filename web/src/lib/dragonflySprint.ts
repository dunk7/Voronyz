/**
 * Ghost Dragonfly pair on a hilled trail.
 * Rigid shoes (no toe fold) run an athletic stride. The trail climbs, drops,
 * and cuts left and right; a planted shoe stays planted while the body moves on.
 */

export const SPRINT_DESIGN_W = 1440;
export const SPRINT_DESIGN_H = 820;
/** Screen Y of the runner when the trail under them is at height 0. */
export const SPRINT_GROUND_Y = 530;
/** Drawn shoe size relative to the outline artwork. */
export const SPRINT_SHOE_SCALE = 0.32;
/**
 * Lift the contact point so soles sit on the top of the trail stroke
 * instead of sinking through its thickness (gray stroke is ~16px).
 */
export const SPRINT_TRAIL_TOP = 14;
/** Fraction of the stride a foot stays on the trail. Below half, so both feet leave the ground. */
export const SPRINT_STANCE = 0.3;
/** How far the forefoot travels along the trail during contact, in design pixels. */
export const SPRINT_STRIDE = 400;
/** Peak height of the forefoot in the air. */
export const SPRINT_LIFT = 128;
/** Full strides per second — athletic jog pace, readable on the poster. */
export const SPRINT_STRIDES_PER_SEC = 1.1;

const REACH = SPRINT_STRIDE / 2;

export type FootPose = {
  /** Forefoot position along the trail, relative to the runner. Positive is forward. */
  x: number;
  /** Forefoot height above the trail. Never negative — the sole stays on or above the line. */
  y: number;
  /** Clockwise degrees of the whole shoe. Positive lifts the heel. Kept mild so toes stay level. */
  rot: number;
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
    if (u < 0.1) squash = lerp(1, 0.92, u / 0.1);
    else if (u < 0.35) squash = lerp(0.92, 1, (u - 0.1) / 0.25);
    // Flat land, then a mild heel-up push. No toe-down angles — those tip the front up.
    const rot = keyed(u, [
      [0, 2],
      [0.25, 0],
      [0.6, 6],
      [1, 12],
    ]);
    return {
      x: REACH - SPRINT_STRIDE * u,
      y: 0,
      rot,
      squash,
    };
  }

  const u = (p - SPRINT_STANCE) / (1 - SPRINT_STANCE);
  const whip = smoother(clamp((u - 0.05) / 0.76, 0, 1));
  const rise =
    u < 0.26
      ? Math.sin((u / 0.26) * (Math.PI / 2))
      : Math.cos(clamp((u - 0.26) / 0.74, 0, 1) * (Math.PI / 2));

  const height = SPRINT_LIFT * rise;
  return {
    x: REACH - SPRINT_STRIDE + SPRINT_STRIDE * whip,
    // Snap float dust at toe-off / land so the sole never reads as below the line.
    y: height < 0.05 ? 0 : height,
    // Keep the shoe nearly level in the air — athletic recovery, not a tipped toe.
    rot: keyed(u, [
      [0, 12],
      [0.2, 6],
      [0.45, 1],
      [0.7, 0],
      [0.88, 1],
      [1, 2],
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
