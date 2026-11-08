/**
 * Side-view sprint for the ghost (wireframe) Dragonfly pair.
 * One cycle is a full stride: short forefoot contact, a flight phase,
 * then the same foot reaches forward. The other foot is half a cycle behind.
 * x moves backward at a constant rate while the shoe is on the path so it
 * sticks to the lane instead of skating.
 */

export const SPRINT_DESIGN_W = 1440;
export const SPRINT_DESIGN_H = 760;
/** Y of the path the soles land on, in design pixels. */
export const SPRINT_GROUND_Y = 590;
/** Drawn shoe size relative to the outline artwork. */
export const SPRINT_SHOE_SCALE = 0.33;
/** Fraction of the stride a foot stays on the path. Below half, so both feet leave the ground. */
export const SPRINT_STANCE = 0.2;
/** How far the forefoot travels backward during contact, in design pixels. */
export const SPRINT_STRIDE = 540;
/** Peak height of the forefoot in the air. */
export const SPRINT_LIFT = 176;
/** Full strides per second. About four steps a second — a sprint, not a jog. */
export const SPRINT_STRIDES_PER_SEC = 2;

const REACH = SPRINT_STRIDE / 2;

export type FootPose = {
  /** Forefoot position relative to the runner, design pixels. Positive is forward. */
  x: number;
  /** Forefoot height above the path. */
  y: number;
  /** Clockwise degrees. Positive lifts the heel and plants the toe. */
  rot: number;
  /** Vertical scale at impact. 1 everywhere else, including the loop seam. */
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

function keyedRotation(u: number, keys: readonly (readonly [number, number])[]) {
  let rot = keys[keys.length - 1][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [p0, r0] = keys[i];
    const [p1, r1] = keys[i + 1];
    if (u <= p1) {
      const span = p1 - p0;
      rot = lerp(r0, r1, span ? smoother((u - p0) / span) : 0);
      break;
    }
  }
  return rot;
}

/** Pose of one foot. `phase` is in stride cycles and wraps. */
export function footPose(phase: number): FootPose {
  const p = ((phase % 1) + 1) % 1;

  if (p < SPRINT_STANCE) {
    const u = p / SPRINT_STANCE;
    let squash = 1;
    if (u < 0.1) squash = lerp(1, 0.91, u / 0.1);
    else if (u < 0.3) squash = lerp(0.91, 1, (u - 0.1) / 0.2);

    return {
      x: REACH - SPRINT_STRIDE * u,
      y: 0,
      rot: lerp(3, 36, u ** 1.35),
      squash,
    };
  }

  const u = (p - SPRINT_STANCE) / (1 - SPRINT_STANCE);
  const whip =
    u < 0.16 ? 0 : 1 - (1 - clamp((u - 0.16) / 0.66, 0, 1)) ** 2.1;
  const rise =
    u < 0.22
      ? Math.sin((u / 0.22) * Math.PI / 2)
      : Math.cos(clamp((u - 0.22) / 0.78, 0, 1) * Math.PI / 2);

  return {
    x: REACH - SPRINT_STRIDE + SPRINT_STRIDE * whip,
    y: SPRINT_LIFT * rise,
    rot: keyedRotation(u, [
      [0, 36],
      [0.16, 12],
      [0.38, -4],
      [0.64, -18],
      [0.86, -5],
      [1, 3],
    ]),
    squash: 1,
  };
}

/** Design pixels per second the lane must scroll so a planted shoe does not skate. */
export function pathSpeed() {
  return (SPRINT_STRIDE / SPRINT_STANCE) * SPRINT_STRIDES_PER_SEC;
}
