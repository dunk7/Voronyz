import assert from "node:assert/strict";
import { test } from "node:test";
import { footPose, SPRINT_STANCE } from "./dragonflySprint";

function close(a: number, b: number, eps = 0.75) {
  assert.ok(Math.abs(a - b) <= eps, `${a} not within ${eps} of ${b}`);
}

test("stride loops without a pose pop", () => {
  const start = footPose(0);
  const end = footPose(0.999);
  close(end.x, start.x, 8);
  close(end.y, start.y, 8);
  close(end.rot, start.rot, 4);
  assert.equal(start.squash, 1);
  assert.equal(footPose(SPRINT_STANCE - 0.0001).squash, 1);
  assert.equal(footPose(SPRINT_STANCE).squash, 1);

  const planted = footPose(SPRINT_STANCE - 0.0001);
  const liftoff = footPose(SPRINT_STANCE);
  close(planted.x, liftoff.x, 2);
  close(planted.y, liftoff.y, 2);
  close(planted.rot, liftoff.rot, 2);
});

test("contact slides backward at a constant rate", () => {
  const a = footPose(0.04);
  const b = footPose(0.08);
  const c = footPose(0.12);
  close(b.x - a.x, c.x - b.x, 0.01);
  assert.ok(b.x < a.x);
  assert.equal(a.y, 0);
  assert.equal(c.y, 0);
});

test("toe-off is a sprint stride, not a rocking pair", () => {
  const back = footPose(SPRINT_STANCE);
  const front = footPose(SPRINT_STANCE + 0.5);
  assert.ok(back.rot > 30, `expected a heel-up push, got ${back.rot}`);
  assert.equal(back.y, 0);
  assert.ok(front.y > 70, `front foot should be reaching in the air, y=${front.y}`);
  assert.ok(front.x > back.x + 250, `stride too short: ${front.x - back.x}`);
  assert.ok(front.rot < 0, `reaching foot should be toe-up, rot=${front.rot}`);
});

test("both shoes leave the path during the stride", () => {
  let flight = false;
  for (let i = 0; i < 24; i++) {
    const phase = i / 24;
    if (footPose(phase).y > 30 && footPose(phase + 0.5).y > 30) flight = true;
  }
  assert.equal(flight, true);
});
