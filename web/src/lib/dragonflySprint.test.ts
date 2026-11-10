import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SPRINT_STANCE,
  SPRINT_STRIDES_PER_SEC,
  footPose,
  trailSample,
} from "./dragonflySprint";

function close(a: number, b: number, eps = 0.75) {
  assert.ok(Math.abs(a - b) <= eps, `${a} not within ${eps} of ${b}`);
}

test("stride loops without a pose pop", () => {
  const start = footPose(0);
  const end = footPose(0.999);
  close(end.x, start.x, 12);
  close(end.y, start.y, 10);
  close(end.rot, start.rot, 4);
  assert.equal(start.squash, 1);
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

test("push-off is a mild rigid heel-up stride, not a bent toe", () => {
  const back = footPose(SPRINT_STANCE);
  const front = footPose(SPRINT_STANCE + 0.5);
  assert.ok(back.rot >= 10, `expected a heel-up push, got ${back.rot}`);
  assert.ok(back.rot <= 16, `heel tip too extreme, rot=${back.rot}`);
  assert.equal(back.y, 0);
  assert.ok(front.y > 50, `front foot should be in the air, y=${front.y}`);
  assert.ok(front.x > back.x + 180, `stride too short: ${front.x - back.x}`);
  for (let i = 0; i < 40; i++) {
    const pose = footPose(i / 40);
    assert.ok(pose.rot >= -1, `toe-down tip at ${i / 40}: rot=${pose.rot}`);
  }
});

test("the sole never drops below the trail", () => {
  for (let i = 0; i < 40; i++) {
    const pose = footPose(i / 40);
    assert.ok(pose.y >= 0, `y went negative at phase ${i / 40}: ${pose.y}`);
  }
});

test("the pace is athletic", () => {
  assert.ok(SPRINT_STRIDES_PER_SEC >= 0.9);
  assert.ok(SPRINT_STRIDES_PER_SEC <= 1.4);
});

test("the trail climbs, drops, and cuts both ways", () => {
  let minH = Infinity;
  let maxH = -Infinity;
  let minL = Infinity;
  let maxL = -Infinity;
  for (let d = 0; d <= 4000; d += 20) {
    const sample = trailSample(d);
    if (sample.height < minH) minH = sample.height;
    if (sample.height > maxH) maxH = sample.height;
    if (sample.lateral < minL) minL = sample.lateral;
    if (sample.lateral > maxL) maxL = sample.lateral;
  }
  assert.ok(minH < -40 && maxH > 40, `height range ${minH}..${maxH}`);
  assert.ok(minL < -80 && maxL > 80, `lateral range ${minL}..${maxL}`);
});
