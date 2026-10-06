import assert from "node:assert/strict";
import { test } from "node:test";
import { createJitteredSites, displacedSite, mulberry32 } from "./voronoiLatticeSites";

test("jittered sites fill the animation bounds with irregular cells", () => {
  const rng = mulberry32(42);
  const sites = createJitteredSites(800, 600, 56, rng);
  assert.ok(sites.length > 40, "enough seeds for a lattice");

  const xs = sites.map((s) => s.x);
  const ys = sites.map((s) => s.y);
  assert.ok(Math.min(...xs) < 80);
  assert.ok(Math.max(...xs) > 720);
  assert.ok(Math.min(...ys) < 80);
  assert.ok(Math.max(...ys) > 520);

  const spacings = [];
  for (let i = 1; i < Math.min(sites.length, 40); i += 1) {
    spacings.push(Math.hypot(sites[i]!.x - sites[i - 1]!.x, sites[i]!.y - sites[i - 1]!.y));
  }
  const unique = new Set(spacings.map((n) => n.toFixed(1)));
  assert.ok(unique.size > 8, "spacings should not be a regular hex grid");
});

test("same seed produces the same lattice", () => {
  const a = createJitteredSites(400, 300, 50, mulberry32(7));
  const b = createJitteredSites(400, 300, 50, mulberry32(7));
  assert.equal(a.length, b.length);
  assert.deepEqual(
    a.map((s) => [s.x, s.y]),
    b.map((s) => [s.x, s.y])
  );
});

test("reduced motion keeps seed points still", () => {
  const site = createJitteredSites(200, 200, 60, mulberry32(1))[0]!;
  assert.deepEqual(displacedSite(site, 12, true), [site.x, site.y]);
  assert.notDeepEqual(displacedSite(site, 12, false), [site.x, site.y]);
});
